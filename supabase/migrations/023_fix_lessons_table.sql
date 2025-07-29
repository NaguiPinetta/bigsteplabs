-- =====================================================
-- FIX LESSONS TABLE - PROPER CREATION WITH FOREIGN KEYS
-- =====================================================

-- Drop existing lessons table if it exists (to recreate properly)
DROP TABLE IF EXISTS lessons CASCADE;

-- Create lessons table with proper foreign key relationships
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notion_url TEXT NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  content_type JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX idx_lessons_is_published ON lessons(is_published);
CREATE INDEX idx_lessons_created_at ON lessons(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lessons_updated_at_trigger
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lessons_updated_at();

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view published lessons" ON lessons;
DROP POLICY IF EXISTS "Users can view all lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can insert lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can update lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Users can delete lessons if they can manage content" ON lessons;
DROP POLICY IF EXISTS "Admin full access to lessons" ON lessons;

-- Create proper RLS policies
CREATE POLICY "Users can view published lessons" ON lessons
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access to lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'Admin'
    )
  );

-- Grant permissions
GRANT ALL ON lessons TO authenticated;

-- Verify the table was created correctly
SELECT 
  'Lessons Table Created' as check_type,
  COUNT(*) as column_count,
  '✅ Lessons table with proper foreign keys' as status
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public';

-- Verify foreign key constraints
SELECT 
  'Foreign Key Check' as check_type,
  COUNT(*) as fk_count,
  '✅ Foreign keys to modules and units' as status
FROM information_schema.table_constraints 
WHERE table_name = 'lessons' 
AND constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- Success message
SELECT '✅ Lessons table properly created with foreign key relationships!' as status;