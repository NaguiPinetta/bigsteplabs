-- Fix the user creation trigger to be more robust
-- The current trigger might be failing due to RLS policies or function calls

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Set default role
    user_role := 'Student';
    
    -- Check if user is in allowlist and get their role
    -- Use direct query instead of function to avoid potential issues
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