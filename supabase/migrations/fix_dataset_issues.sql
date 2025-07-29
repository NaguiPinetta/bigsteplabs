-- Fix Dataset Issues SQL Script
-- This script addresses common dataset-related problems

-- 1. Ensure datasets table exists with all required columns
CREATE TABLE IF NOT EXISTS datasets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    content_type TEXT DEFAULT 'file',
    text_content TEXT,
    text_format TEXT DEFAULT 'plain',
    total_chunks INTEGER DEFAULT 0,
    processing_status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add missing columns to existing datasets table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datasets' AND column_name = 'content_type') THEN
        ALTER TABLE datasets ADD COLUMN content_type TEXT DEFAULT 'file';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datasets' AND column_name = 'text_content') THEN
        ALTER TABLE datasets ADD COLUMN text_content TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datasets' AND column_name = 'text_format') THEN
        ALTER TABLE datasets ADD COLUMN text_format TEXT DEFAULT 'plain';
    END IF;
END $$;

-- 2. Ensure dataset_chunks table exists
CREATE TABLE IF NOT EXISTS dataset_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL,
    index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    char_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_dataset_chunks_dataset_id ON dataset_chunks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_chunks_index ON dataset_chunks(dataset_id, index);

-- 4. Add constraints if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'datasets_content_type_check') THEN
        ALTER TABLE datasets ADD CONSTRAINT datasets_content_type_check CHECK (content_type IN ('file', 'text'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'datasets_text_format_check') THEN
        ALTER TABLE datasets ADD CONSTRAINT datasets_text_format_check CHECK (text_format IN ('plain', 'markdown', 'json'));
    END IF;
END $$;

-- 5. Enable RLS on both tables
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_chunks ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view all datasets" ON datasets;
DROP POLICY IF EXISTS "Authenticated users can manage datasets" ON datasets;
DROP POLICY IF EXISTS "Authenticated users can view all dataset chunks" ON dataset_chunks;
DROP POLICY IF EXISTS "Authenticated users can manage dataset chunks" ON dataset_chunks;

-- 7. Create new RLS policies
CREATE POLICY "Authenticated users can view all datasets" ON datasets 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage datasets" ON datasets 
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all dataset chunks" ON dataset_chunks 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage dataset chunks" ON dataset_chunks 
FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
CREATE TRIGGER update_datasets_updated_at 
    BEFORE UPDATE ON datasets 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- 10. Create storage bucket if it doesn't exist
-- Note: This requires the storage extension to be enabled
-- The bucket creation is handled by Supabase automatically when needed

-- 11. Grant necessary permissions
GRANT ALL ON datasets TO authenticated;
GRANT ALL ON dataset_chunks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12. Update existing datasets to have default values
UPDATE datasets SET content_type = 'file' WHERE content_type IS NULL;
UPDATE datasets SET text_format = 'plain' WHERE text_format IS NULL;
UPDATE datasets SET processing_status = 'pending' WHERE processing_status IS NULL;
UPDATE datasets SET total_chunks = 0 WHERE total_chunks IS NULL;

-- 13. Verify the setup
SELECT 
    'datasets' as table_name,
    COUNT(*) as record_count,
    'OK' as status
FROM datasets
UNION ALL
SELECT 
    'dataset_chunks' as table_name,
    COUNT(*) as record_count,
    'OK' as status
FROM dataset_chunks;

-- 14. Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('datasets', 'dataset_chunks')
ORDER BY tablename, policyname; 