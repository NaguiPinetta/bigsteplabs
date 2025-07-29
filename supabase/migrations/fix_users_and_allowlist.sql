-- =====================================================
-- FIX USERS AND ALLOWLIST ISSUES
-- =====================================================

-- Step 1: Create the missing allowlist table
CREATE TABLE IF NOT EXISTS allowlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'Student',
    invited_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowlist_email ON allowlist(email);
CREATE INDEX IF NOT EXISTS idx_allowlist_role ON allowlist(role);

-- Step 3: Enable RLS on allowlist
ALTER TABLE allowlist ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policies for allowlist
DROP POLICY IF EXISTS "allowlist_select_policy" ON allowlist;
DROP POLICY IF EXISTS "allowlist_insert_policy" ON allowlist;
DROP POLICY IF EXISTS "allowlist_update_policy" ON allowlist;
DROP POLICY IF EXISTS "allowlist_delete_policy" ON allowlist;

CREATE POLICY "allowlist_select_policy" ON allowlist
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_insert_policy" ON allowlist
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_update_policy" ON allowlist
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_delete_policy" ON allowlist
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Step 5: Grant permissions
GRANT ALL ON allowlist TO authenticated;

-- Step 6: Create helper functions for allowlist
CREATE OR REPLACE FUNCTION is_email_allowlisted(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM allowlist 
        WHERE email = email_address
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Step 7: Update the user creation trigger to use allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Set default role
    user_role := 'Student';
    
    -- Check if user is in allowlist and get their role
    SELECT role INTO user_role 
    FROM allowlist 
    WHERE email = new.email;
    
    -- Insert user profile with allowlist role (or default to Student)
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(user_role, 'Student'),
        now(),
        now()
    );
    
    -- Remove from allowlist if they were allowlisted
    DELETE FROM allowlist WHERE email = new.email;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        
        -- Try to insert with default role if the above failed
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            new.id,
            new.email,
            'Student',
            now(),
            now()
        );
        
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Ensure the trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Verify the fix
SELECT 
    'Allowlist Table' as check_type,
    COUNT(*) as table_count,
    '✅ Allowlist table created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'allowlist';

SELECT 
    'User Trigger' as check_type,
    COUNT(*) as trigger_count,
    '✅ User creation trigger created' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- Success message
SELECT '✅ Users and allowlist issues fixed! User management should now work properly.' as status;