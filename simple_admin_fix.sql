-- =====================================================
-- SIMPLE ADMIN FIX - USER + RLS POLICIES ONLY
-- =====================================================
-- This script ONLY fixes user admin access and RLS policies
-- No sample data, just permissions

-- Step 1: Ensure user exists as Admin
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

-- Step 2: Update existing user to Admin if needed
UPDATE public.users 
SET role = 'Admin'::user_role, updated_at = now()
WHERE email = 'jdpinetta@gmail.com' AND role != 'Admin';

-- Step 3: Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Public read access to published modules" ON modules;
DROP POLICY IF EXISTS "Admin full access to modules" ON modules;
DROP POLICY IF EXISTS "Public read access to published units" ON units;
DROP POLICY IF EXISTS "Admin full access to units" ON units;
DROP POLICY IF EXISTS "Public read access to published content" ON content;
DROP POLICY IF EXISTS "Admin full access to content" ON content;
DROP POLICY IF EXISTS "Users can view their own personas" ON personas;
DROP POLICY IF EXISTS "Users can manage their own personas" ON personas;
DROP POLICY IF EXISTS "Public read access to active models" ON models;
DROP POLICY IF EXISTS "Admin full access to models" ON models;
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
DROP POLICY IF EXISTS "Users can view their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can manage their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON messages;
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON messages;

-- Step 4: Create simple admin policies - Admin gets full access to everything
CREATE POLICY "Admin full access to users" ON users 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

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

-- Step 5: Verify user is admin
SELECT 
  'User Status' as check_type,
  u.email,
  u.role,
  CASE WHEN u.role = 'Admin' THEN '✅ Admin access granted' ELSE '❌ Not admin' END as status
FROM public.users u
WHERE u.email = 'jdpinetta@gmail.com';

-- Step 6: Count policies created
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count,
  '✅ Admin policies created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%Admin full access%';

-- Success message
SELECT '✅ Admin access setup complete! You can now log in and access everything.' as status;