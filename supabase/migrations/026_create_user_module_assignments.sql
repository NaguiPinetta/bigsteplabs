-- Create user module assignments table
-- This allows admins to assign specific modules to users

CREATE TABLE IF NOT EXISTS user_module_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique user-module combinations
    UNIQUE(user_id, module_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_user_id ON user_module_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_module_id ON user_module_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_active ON user_module_assignments(is_active);

-- Enable RLS
ALTER TABLE user_module_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_module_assignments
-- Admins can manage all assignments
CREATE POLICY "Admins can manage user module assignments" ON user_module_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

-- Users can view their own assignments
CREATE POLICY "Users can view own module assignments" ON user_module_assignments
FOR SELECT USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON user_module_assignments TO authenticated;

-- Create helper function to check if user has access to a module
CREATE OR REPLACE FUNCTION user_has_module_access(user_uuid UUID, module_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins have access to all modules
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_uuid 
        AND users.role = 'Admin'
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has explicit assignment to this module
    RETURN EXISTS (
        SELECT 1 FROM user_module_assignments 
        WHERE user_id = user_uuid 
        AND module_id = module_uuid 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's accessible modules
CREATE OR REPLACE FUNCTION get_user_accessible_modules(user_uuid UUID)
RETURNS TABLE (
    module_id UUID,
    module_title TEXT,
    module_description TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Return all modules for admins
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_uuid 
        AND users.role = 'Admin'
    ) THEN
        RETURN QUERY
        SELECT 
            m.id as module_id,
            m.title as module_title,
            m.description as module_description,
            NOW() as assigned_at,
            NULL as expires_at
        FROM modules m
        WHERE m.is_published = true
        ORDER BY m.order_index, m.created_at;
    ELSE
        -- Return only assigned modules for regular users
        RETURN QUERY
        SELECT 
            m.id as module_id,
            m.title as module_title,
            m.description as module_description,
            uma.assigned_at,
            uma.expires_at
        FROM user_module_assignments uma
        JOIN modules m ON m.id = uma.module_id
        WHERE uma.user_id = user_uuid 
        AND uma.is_active = true
        AND (uma.expires_at IS NULL OR uma.expires_at > NOW())
        AND m.is_published = true
        ORDER BY m.order_index, m.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 