-- =====================================================
-- TEST LESSONS TABLE STATE
-- =====================================================

-- Check if lessons table exists
SELECT 
  'Lessons Table Exists' as check_type,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public') 
    THEN '✅ Yes' 
    ELSE '❌ No' 
  END as status;

-- Check lessons table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
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

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'lessons';

-- Check if modules and units tables exist
SELECT 
  'Modules Table' as table_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'modules' AND table_schema = 'public') 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END as status
UNION ALL
SELECT 
  'Units Table' as table_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units' AND table_schema = 'public') 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END as status;

-- Count records in related tables
SELECT 
  'modules' as table_name,
  COUNT(*) as record_count
FROM modules
UNION ALL
SELECT 
  'units' as table_name,
  COUNT(*) as record_count
FROM units
UNION ALL
SELECT 
  'lessons' as table_name,
  COUNT(*) as record_count
FROM lessons;