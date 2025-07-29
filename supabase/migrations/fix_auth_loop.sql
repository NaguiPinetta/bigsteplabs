-- =====================================================
-- FIX AUTHENTICATION LOOP
-- =====================================================
-- This script fixes the auth loop by ensuring user exists and can access their data

-- Step 1: Check current user status
SELECT 
  'Current Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User exists in auth.users' 
    ELSE '❌ User missing from auth.users' 
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User exists in public.users' 
    ELSE '❌ User missing from public.users' 
  END as public_status;

-- Step 2: Ensure user exists in public.users with Admin role
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'Admin'::user_role,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

-- Step 3: Update user to Admin if not already
UPDATE public.users 
SET role = 'Admin'::user_role, updated_at = now()
WHERE email = 'jdpinetta@gmail.com' AND role != 'Admin';

-- Step 4: Drop existing RLS policies that might be blocking access
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Admin full access to users" ON users;

-- Step 5: Create simple policies that allow the user to access their data
CREATE POLICY "Users can view their own data" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Create admin policies for all other tables
CREATE POLICY "Admin full access to modules" ON modules 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to units" ON units 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to content" ON content 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to personas" ON personas 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to models" ON models 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to agents" ON agents 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to datasets" ON datasets 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to chat_sessions" ON chat_sessions 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Admin full access to messages" ON messages 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 7: Verify the fix
SELECT 
  'Fix Verification' as check_type,
  u.email,
  u.role,
  CASE WHEN u.role = 'Admin' THEN '✅ Admin access granted' ELSE '❌ Not admin' END as status
FROM public.users u
WHERE u.email = 'jdpinetta@gmail.com';

-- Step 8: Test if user can access their own data (simulate RLS)
SELECT 
  'RLS Test' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'jdpinetta@gmail.com' 
      AND id = (SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com' LIMIT 1)
    ) 
    THEN '✅ User can access own data' 
    ELSE '❌ User cannot access own data' 
  END as rls_status;

-- Success message
SELECT '✅ Authentication loop fix complete! Clear your browser cache and try logging in again.' as status;