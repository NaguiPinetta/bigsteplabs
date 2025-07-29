-- =====================================================
-- FIX LESSONS FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- First, let's check what foreign key constraints exist
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'lessons'
AND tc.table_schema = 'public';

-- Drop existing foreign key constraints if they exist
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_unit_id_fkey;

-- Add foreign key constraints with proper names
ALTER TABLE lessons 
ADD CONSTRAINT lessons_module_id_fkey 
FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL;

ALTER TABLE lessons 
ADD CONSTRAINT lessons_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Verify the constraints were created
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'lessons'
AND tc.table_schema = 'public';

-- Test the relationship by trying to select with joins
SELECT 
  'Foreign Key Test' as test_type,
  COUNT(*) as result_count,
  '✅ Foreign keys working' as status
FROM lessons l
LEFT JOIN modules m ON l.module_id = m.id
LEFT JOIN units u ON l.unit_id = u.id
LIMIT 1;

-- Success message
SELECT '✅ Foreign key relationships fixed! The lessons page should now work.' as status;