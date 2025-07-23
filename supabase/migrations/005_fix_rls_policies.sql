-- Fix RLS policies to work with magic link authentication
-- The issue is that users signing up via magic link don't have a record in the users table
-- So we need to make policies more permissive for authenticated users

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Admins and Collaborators can view all modules" ON modules;
DROP POLICY IF EXISTS "Admins and Collaborators can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins and Collaborators can view all units" ON units;
DROP POLICY IF EXISTS "Admins and Collaborators can manage units" ON units;
DROP POLICY IF EXISTS "Admins and Collaborators can view all content" ON content;
DROP POLICY IF EXISTS "Admins and Collaborators can manage content" ON content;
DROP POLICY IF EXISTS "Admins can view all datasets" ON datasets;
DROP POLICY IF EXISTS "Admins can manage all datasets" ON datasets;
DROP POLICY IF EXISTS "Admins can view all chunks" ON content_chunks;
DROP POLICY IF EXISTS "Admins can manage all chunks" ON content_chunks;
DROP POLICY IF EXISTS "Admins and Collaborators can manage personas" ON personas;
DROP POLICY IF EXISTS "Admins can view and manage models" ON models;
DROP POLICY IF EXISTS "Collaborators can view active models" ON models;
DROP POLICY IF EXISTS "Admins and Collaborators can manage agents" ON agents;
DROP POLICY IF EXISTS "Admins and Collaborators can manage unit agents" ON unit_agents;
DROP POLICY IF EXISTS "Admins can view all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all user progress" ON user_progress;

-- Create more permissive policies for authenticated users
-- Modules policies
CREATE POLICY "Authenticated users can view all modules" ON modules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage modules" ON modules FOR ALL USING (auth.uid() IS NOT NULL);

-- Units policies  
CREATE POLICY "Authenticated users can view all units" ON units FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage units" ON units FOR ALL USING (auth.uid() IS NOT NULL);

-- Content policies
CREATE POLICY "Authenticated users can view all content" ON content FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage content" ON content FOR ALL USING (auth.uid() IS NOT NULL);

-- Datasets policies
CREATE POLICY "Authenticated users can view all datasets" ON datasets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage datasets" ON datasets FOR ALL USING (auth.uid() IS NOT NULL);

-- Content chunks policies
CREATE POLICY "Authenticated users can view all chunks" ON content_chunks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage chunks" ON content_chunks FOR ALL USING (auth.uid() IS NOT NULL);

-- Personas policies
CREATE POLICY "Authenticated users can manage personas" ON personas FOR ALL USING (auth.uid() IS NOT NULL);

-- Models policies
CREATE POLICY "Authenticated users can view and manage models" ON models FOR ALL USING (auth.uid() IS NOT NULL);

-- Agents policies
CREATE POLICY "Authenticated users can manage agents" ON agents FOR ALL USING (auth.uid() IS NOT NULL);

-- Unit agents policies
CREATE POLICY "Authenticated users can manage unit agents" ON unit_agents FOR ALL USING (auth.uid() IS NOT NULL);

-- Chat sessions policies
CREATE POLICY "Authenticated users can view all chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() IS NOT NULL);

-- Messages policies
CREATE POLICY "Authenticated users can view all messages" ON messages FOR SELECT USING (auth.uid() IS NOT NULL);

-- User progress policies
CREATE POLICY "Authenticated users can view all user progress" ON user_progress FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create a function to automatically create user records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    'Student', -- Default role for new users
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record when someone signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 