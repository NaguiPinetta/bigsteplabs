-- Fix Agents Issues SQL Script
-- This script addresses common agent-related problems

-- 1. Ensure agents table exists with all required columns
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    persona_id UUID REFERENCES personas(id) NOT NULL,
    model_id UUID REFERENCES models(id) NOT NULL,
    dataset_ids UUID[] DEFAULT '{}',
    tools JSONB DEFAULT '[]',
    output_format TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    whisper_language TEXT DEFAULT 'en',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Add missing columns to existing agents table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'whisper_language') THEN
        ALTER TABLE agents ADD COLUMN whisper_language TEXT DEFAULT 'en';
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_persona_id ON agents(persona_id);
CREATE INDEX IF NOT EXISTS idx_agents_model_id ON agents(model_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON agents(created_by);

-- 4. Enable RLS on agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view all agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON agents;
DROP POLICY IF EXISTS "Admins can manage all agents" ON agents;
DROP POLICY IF EXISTS "Admins can view all agents" ON agents;
DROP POLICY IF EXISTS "Users can create agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;

-- 6. Create new RLS policies
CREATE POLICY "Authenticated users can view all agents" ON agents 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage agents" ON agents 
FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- 9. Grant necessary permissions
GRANT ALL ON agents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 10. Update existing agents to have default values
UPDATE agents SET whisper_language = 'en' WHERE whisper_language IS NULL;
UPDATE agents SET dataset_ids = '{}' WHERE dataset_ids IS NULL;
UPDATE agents SET tools = '[]' WHERE tools IS NULL;
UPDATE agents SET is_active = TRUE WHERE is_active IS NULL;

-- 11. Verify the setup
SELECT 
    'agents' as table_name,
    COUNT(*) as record_count,
    'OK' as status
FROM agents;

-- 12. Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

-- 13. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='agents'; 