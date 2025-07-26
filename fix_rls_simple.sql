-- Simple RLS fix for users table
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a simple policy that allows all operations
-- This will allow the service role key to work properly
CREATE POLICY "allow_all_operations" ON users
FOR ALL USING (true);

-- Grant all permissions (users table uses UUIDs, no sequence needed)
GRANT ALL ON users TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE users FORCE ROW LEVEL SECURITY; 