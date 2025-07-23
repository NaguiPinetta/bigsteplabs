-- Fix RLS policies for users table
-- The users table needs policies to allow authenticated users to create and manage their own records

-- Drop existing policies on users table if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create policies for users table
-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON users 
FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Also allow the trigger function to insert any user profile
CREATE POLICY "Allow trigger to insert user profiles" ON users 
FOR INSERT WITH CHECK (true);

-- Grant necessary permissions on users table
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated; 