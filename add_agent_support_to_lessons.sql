-- =====================================================
-- ADD AGENT SUPPORT TO LESSONS TABLE
-- =====================================================

-- Add agent_id to lessons table if it doesn't exist
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Add order_index to lessons table if it doesn't exist
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add content_type to lessons table to distinguish between embedded content and agent chats
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'embedded' CHECK (content_type IN ('embedded', 'agent_chat'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_agent_id ON lessons(agent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_content_type ON lessons(content_type);

-- Create function to reorder lessons within a unit
CREATE OR REPLACE FUNCTION reorder_lessons(p_lesson_ids UUID[])
RETURNS VOID AS $$
DECLARE
  lesson_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each lesson in the provided order
  FOREACH lesson_id IN ARRAY p_lesson_ids
  LOOP
    UPDATE lessons 
    SET order_index = new_order
    WHERE id = lesson_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to reorder modules
CREATE OR REPLACE FUNCTION reorder_modules(p_module_ids UUID[])
RETURNS VOID AS $$
DECLARE
  module_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each module in the provided order
  FOREACH module_id IN ARRAY p_module_ids
  LOOP
    UPDATE modules 
    SET order_index = new_order
    WHERE id = module_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to reorder units within a module
CREATE OR REPLACE FUNCTION reorder_units(p_unit_ids UUID[])
RETURNS VOID AS $$
DECLARE
  unit_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each unit in the provided order
  FOREACH unit_id IN ARRAY p_unit_ids
  LOOP
    UPDATE units 
    SET order_index = new_order
    WHERE id = unit_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on reorder functions
GRANT EXECUTE ON FUNCTION reorder_lessons(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_modules(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_units(UUID[]) TO authenticated;

-- Verify the changes
SELECT 
  'Lessons Table Updated' as check_type,
  COUNT(*) as column_count,
  '✅ agent_id, order_index, and content_type added to lessons table' as status
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name IN ('agent_id', 'order_index', 'content_type')
AND table_schema = 'public';

-- Success message
SELECT '✅ Agent support added to lessons table successfully!' as status; 