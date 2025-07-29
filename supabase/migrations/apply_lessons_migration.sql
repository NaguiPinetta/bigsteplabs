-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
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
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);

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

-- RLS Policies
CREATE POLICY "Users can view published lessons" ON lessons
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view all lessons if they can manage content" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'Admin' OR auth.users.raw_user_meta_data->>'role' = 'Collaborator')
    )
  );

CREATE POLICY "Users can insert lessons if they can manage content" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'Admin' OR auth.users.raw_user_meta_data->>'role' = 'Collaborator')
    )
  );

CREATE POLICY "Users can update lessons if they can manage content" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'Admin' OR auth.users.raw_user_meta_data->>'role' = 'Collaborator')
    )
  );

CREATE POLICY "Users can delete lessons if they can manage content" ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'Admin' OR auth.users.raw_user_meta_data->>'role' = 'Collaborator')
    )
  );

-- Migrate existing content data (if content table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content') THEN
    INSERT INTO lessons (title, notion_url, module_id, unit_id, content_type, is_published, created_at)
    SELECT 
      COALESCE(title, 'Migrated Content'),
      COALESCE(file_url, 'https://notion.so/placeholder'),
      module_id,
      unit_id,
      COALESCE(content_type, '{}'::jsonb),
      COALESCE(is_published, false),
      COALESCE(created_at, NOW())
    FROM content;
    
    RAISE NOTICE 'Migrated % rows from content table to lessons table', (SELECT COUNT(*) FROM content);
  ELSE
    RAISE NOTICE 'Content table does not exist, skipping migration';
  END IF;
END $$;