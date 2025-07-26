-- Fix RLS policies for allowlist and users tables
-- The current policies are too restrictive and preventing access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage allowlist" ON allowlist;
DROP POLICY IF EXISTS "Users can view own allowlist entry" ON allowlist;

-- Create more permissive policies for allowlist
-- Allow all authenticated users to view allowlist (needed for the helper functions)
CREATE POLICY "Authenticated users can view allowlist" ON allowlist
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow admins to manage allowlist
CREATE POLICY "Admins can manage allowlist" ON allowlist
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

-- Fix users table policies to be more permissive for admins
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON users;

-- Create more permissive policies for users table
-- Allow all authenticated users to view users (needed for admin functions)
CREATE POLICY "Authenticated users can view users" ON users
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

-- Allow the trigger function to insert any user profile
CREATE POLICY "Allow trigger to insert user profiles" ON users
FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON allowlist TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SEQUENCE allowlist_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated; 