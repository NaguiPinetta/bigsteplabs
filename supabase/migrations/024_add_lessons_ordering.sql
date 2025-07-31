-- =====================================================
-- ADD ORDERING SUPPORT TO LESSONS TABLE
-- =====================================================

-- Add order_index to lessons table if it doesn't exist
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);

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

-- Grant execute permissions on reorder function
GRANT EXECUTE ON FUNCTION reorder_lessons(UUID[]) TO authenticated;

-- Update existing lessons to have proper order_index values
UPDATE lessons 
SET order_index = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY created_at) as row_num
  FROM lessons
  WHERE unit_id IS NOT NULL
) as subquery
WHERE lessons.id = subquery.id;

-- Success message
SELECT '✅ Lessons ordering support added successfully!' as status; 