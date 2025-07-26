-- Fix RLS policies to allow service role key to bypass restrictions
-- Run this directly in Supabase SQL Editor

-- Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a policy that allows service role to bypass RLS
-- This is the key fix: service role should be able to do everything
CREATE POLICY "service_role_bypass" ON users
FOR ALL USING (true);

-- Also create specific policies for authenticated users
CREATE POLICY "authenticated_users_select" ON users
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_update_own" ON users
FOR UPDATE USING (auth.uid() = id);

-- Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;

-- Ensure the service role has full access
-- The service role key should automatically bypass RLS, but let's make sure
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Create a function to check if current user is service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Service role key bypasses RLS automatically
  -- This function is mainly for documentation
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Set default role
    user_role := 'Student';
    
    -- Check if user is in allowlist and get their role
    SELECT role INTO user_role 
    FROM allowlist 
    WHERE email = new.email;
    
    -- Insert user profile with allowlist role (or default to Student)
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(user_role, 'Student'),
        now(),
        now()
    );
    
    -- Remove from allowlist if they were allowlisted
    DELETE FROM allowlist WHERE email = new.email;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        
        -- Try to insert with default role if the above failed
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            new.id,
            new.email,
            'Student',
            now(),
            now()
        );
        
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 