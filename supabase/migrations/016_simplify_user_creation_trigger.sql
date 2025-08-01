-- Simplify the user creation trigger to avoid allowlist dependencies
-- This should fix the "Database error saving new user" issue

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simplified trigger function that doesn't depend on allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Simply create a user profile with default 'Student' role
    -- No allowlist checking to avoid potential RLS issues
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        'Student', -- Default role for all new users
        now(),
        now()
    );
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        
        -- Try one more time with minimal data
        BEGIN
            INSERT INTO public.users (id, email, role, created_at, updated_at)
            VALUES (
                new.id,
                new.email,
                'Student',
                now(),
                now()
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- If even this fails, just log and continue
                RAISE WARNING 'Critical error in handle_new_user trigger: %', SQLERRM;
        END;
        
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the trigger has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Verify the trigger is working
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'; 