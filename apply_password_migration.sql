-- Apply password support migration for BigStepLabs
-- Run this in your Supabase SQL Editor

-- Step 1: Add user_credentials table for username/password authentication
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_username ON user_credentials(username);

-- Step 3: Add RLS policies
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own credentials
CREATE POLICY "Users can view their own credentials" ON user_credentials
    FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to manage all credentials
CREATE POLICY "Admins can manage all credentials" ON user_credentials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'
        )
    );

-- Step 4: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credentials_updated_at 
    BEFORE UPDATE ON user_credentials 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 5: Grant permissions
GRANT ALL ON user_credentials TO authenticated;
GRANT ALL ON user_credentials TO service_role;

-- Step 6: Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_credentials' 
ORDER BY ordinal_position; 