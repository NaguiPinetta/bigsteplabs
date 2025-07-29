-- =====================================================
-- STEP 3: SAFE RLS POLICY FIX
-- =====================================================
-- This script ONLY CREATES policies - no destructive operations
-- Safe to run multiple times (uses DROP IF EXISTS)

-- Step 1: Drop existing policies to avoid conflicts (safe - only drops policies)
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

-- Step 2: Create comprehensive RLS policies for users table
CREATE POLICY "Users can view their own data" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 3: Create comprehensive RLS policies for modules table
CREATE POLICY "Public read access to published modules" ON modules 
FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access to modules" ON modules 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 4: Create comprehensive RLS policies for units table
CREATE POLICY "Public read access to published units" ON units 
FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access to units" ON units 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 5: Create comprehensive RLS policies for content table
CREATE POLICY "Public read access to published content" ON content 
FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access to content" ON content 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 6: Create comprehensive RLS policies for personas table
CREATE POLICY "Users can view their own personas" ON personas 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own personas" ON personas 
FOR ALL USING (user_id = auth.uid());

-- Step 7: Create comprehensive RLS policies for models table
CREATE POLICY "Public read access to active models" ON models 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access to models" ON models 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 8: Create comprehensive RLS policies for agents table
CREATE POLICY "Users can view their own agents" ON agents 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own agents" ON agents 
FOR ALL USING (user_id = auth.uid());

-- Step 9: Create comprehensive RLS policies for datasets table
CREATE POLICY "Users can view their own datasets" ON datasets 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own datasets" ON datasets 
FOR ALL USING (user_id = auth.uid());

-- Step 10: Create comprehensive RLS policies for chat_sessions table
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own chat sessions" ON chat_sessions 
FOR ALL USING (user_id = auth.uid());

-- Step 11: Create comprehensive RLS policies for messages table
CREATE POLICY "Users can view messages in their sessions" ON messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_sessions cs 
    WHERE cs.id = messages.session_id 
    AND cs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage messages in their sessions" ON messages 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_sessions cs 
    WHERE cs.id = messages.session_id 
    AND cs.user_id = auth.uid()
  )
);

-- Step 12: Verify policies were created (safe read-only operation)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'modules', 'units', 'content', 'personas', 'models', 'agents', 'datasets', 'chat_sessions', 'messages')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Step 3: RLS policies updated safely!' as status;