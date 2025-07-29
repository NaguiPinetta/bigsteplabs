-- Fix missing dataset_chunks table
-- Run this SQL directly in your Supabase SQL editor

-- Add dataset_chunks table for storing processed content chunks
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dataset_chunks_dataset_id ON dataset_chunks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_chunks_index ON dataset_chunks(dataset_id, index);

-- Add RLS policies for dataset_chunks
CREATE POLICY "Authenticated users can view all dataset chunks" ON dataset_chunks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage dataset chunks" ON dataset_chunks FOR ALL USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_dataset_chunks_updated_at BEFORE UPDATE ON dataset_chunks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 