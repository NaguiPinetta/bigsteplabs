-- Create API keys table for storing provider API keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'openai', 'anthropic', 'cohere', etc.
    api_key TEXT NOT NULL, -- encrypted API key
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can see all API keys
CREATE POLICY "Admins can view all API keys" ON api_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'
        )
    );

-- Only admins can insert/update/delete API keys
CREATE POLICY "Admins can manage API keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some default API keys (you'll need to update these with real keys)
INSERT INTO api_keys (name, provider, api_key, created_by) VALUES
    ('OpenAI Default', 'openai', 'your-openai-api-key-here', 
     (SELECT id FROM users WHERE role = 'Admin' LIMIT 1))
ON CONFLICT DO NOTHING;
