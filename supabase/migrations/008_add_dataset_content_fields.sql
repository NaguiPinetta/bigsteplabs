-- Add missing content fields to datasets table
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'file',
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS text_format TEXT DEFAULT 'plain';

-- Add check constraint for content_type
ALTER TABLE datasets 
ADD CONSTRAINT datasets_content_type_check 
CHECK (content_type IN ('file', 'text'));

-- Add check constraint for text_format
ALTER TABLE datasets 
ADD CONSTRAINT datasets_text_format_check 
CHECK (text_format IN ('plain', 'markdown', 'json'));

-- Update existing datasets to have default content_type
UPDATE datasets SET content_type = 'file' WHERE content_type IS NULL; 