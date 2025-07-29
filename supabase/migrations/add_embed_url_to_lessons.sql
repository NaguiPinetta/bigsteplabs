-- Add embed_url column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS embed_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN lessons.embed_url IS 'Direct embed URL for Notion pages (e.g., /ebd/ format)';

-- Update RLS policies to include embed_url
DROP POLICY IF EXISTS "Users can view published lessons" ON lessons;
CREATE POLICY "Users can view published lessons" ON lessons
  FOR SELECT USING (
    is_published = true OR 
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'Admin' OR role = 'Collaborator'
    )
  );

DROP POLICY IF EXISTS "Content managers can manage lessons" ON lessons;
CREATE POLICY "Content managers can manage lessons" ON lessons
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'Admin' OR role = 'Collaborator'
    )
  );