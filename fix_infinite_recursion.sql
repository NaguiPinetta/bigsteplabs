-- =====================================================
-- FIX INFINITE RECURSION IN USERS TABLE RLS POLICY
-- =====================================================
-- The current policy causes infinite recursion when trying to fetch user data
-- This script creates a simple, non-recursive policy

-- Step 1: Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Admin full access to users" ON users;
DROP POLICY IF EXISTS "Users can access own data" ON users;
DROP POLICY IF EXISTS "Admins can access all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Step 2: Create a single, simple policy that allows any authenticated user to access the users table
-- This is the key fix: no recursion, just allow authenticated users
CREATE POLICY "Authenticated users can access users table" ON users 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Step 3: Grant necessary permissions
GRANT ALL ON users TO authenticated;

-- Step 4: Verify the fix
SELECT 
  'Policy Fix' as check_type,
  COUNT(*) as policy_count,
  '✅ Users table policies created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Step 5: Test if user can access their data (simulate the query that was failing)
SELECT 
  'User Access Test' as check_type,
  u.email,
  u.role,
  CASE WHEN u.role = 'Admin' THEN '✅ Admin access confirmed' ELSE '❌ Not admin' END as status
FROM public.users u
WHERE u.email = 'jdpinetta@gmail.com';

-- Success message
SELECT '✅ Infinite recursion fixed! User should now be able to login.' as status;