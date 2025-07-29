-- Fix the Notion URL by removing the space
UPDATE lessons 
SET notion_url = REPLACE(notion_url, 'source=copy Link', 'source=copy_link')
WHERE notion_url LIKE '%source=copy Link%';

-- Show the result
SELECT title, notion_url FROM lessons;