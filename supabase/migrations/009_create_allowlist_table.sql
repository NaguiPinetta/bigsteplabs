-- Create allowlist table for managing user access
CREATE TABLE IF NOT EXISTS allowlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'Student',
    invited_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowlist_email ON allowlist(email);
CREATE INDEX IF NOT EXISTS idx_allowlist_role ON allowlist(role);

-- Grant permissions
GRANT ALL ON allowlist TO authenticated;
GRANT USAGE ON SEQUENCE allowlist_id_seq TO authenticated;

-- Create RLS policies for allowlist
ALTER TABLE allowlist ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage allowlist
CREATE POLICY "Admins can manage allowlist" ON allowlist
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

-- Allow users to view their own allowlist entry
CREATE POLICY "Users can view own allowlist entry" ON allowlist
FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to check if email is allowlisted
CREATE OR REPLACE FUNCTION is_email_allowlisted(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM allowlist 
        WHERE email = email_address
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get allowlist role for email
CREATE OR REPLACE FUNCTION get_allowlist_role(email_address TEXT)
RETURNS user_role AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role 
    FROM allowlist 
    WHERE email = email_address;
    
    RETURN COALESCE(user_role, 'Student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 