-- =====================================================
-- FIX LESSONS TABLE RLS POLICIES
-- =====================================================
-- The current policies are checking auth.users.raw_user_meta_data instead of public.users
-- This script fixes the policies to work with our user role system

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view published lessons" ON lessons;
DROP POLICY IF EXISTS "Users can view all lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can insert lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can update lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can delete lessons if they can manage content" ON lessons;

-- Create new policies that work with our user role system
CREATE POLICY "Users can view published lessons" ON lessons
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view all lessons if they can manage content" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND (public.users.role = 'Admin' OR public.users.role = 'Collaborator')
    )
  );

CREATE POLICY "Users can insert lessons if they can manage content" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND (public.users.role = 'Admin' OR public.users.role = 'Collaborator')
    )
  );

CREATE POLICY "Users can update lessons if they can manage content" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND (public.users.role = 'Admin' OR public.users.role = 'Collaborator')
    )
  );

CREATE POLICY "Users can delete lessons if they can manage content" ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND (public.users.role = 'Admin' OR public.users.role = 'Collaborator')
    )
  );

-- Grant permissions
GRANT ALL ON lessons TO authenticated;

-- Verify the fix
SELECT 
  'RLS Policies Fixed' as check_type,
  COUNT(*) as policy_count,
  '✅ Lessons table policies updated' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'lessons';

-- Success message
SELECT '✅ Lessons table RLS policies fixed! The lessons page should now work properly.' as status;