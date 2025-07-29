-- =====================================================
-- FIX NOTION URL IN EXISTING LESSON
-- =====================================================

-- Update the Notion URL to fix the space in the query parameter
UPDATE lessons 
SET notion_url = REPLACE(notion_url, 'source=copy Link', 'source=copy_link')
WHERE notion_url LIKE '%source=copy Link%';

-- Verify the fix
SELECT 
  id,
  title,
  notion_url,
  '✅ URL fixed' as status
FROM lessons 
WHERE notion_url LIKE '%source=copy_link%';

-- Success message
SELECT '✅ Notion URL fixed! The lesson should now embed properly.' as status;