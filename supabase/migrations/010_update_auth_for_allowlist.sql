-- Update the auth trigger to use allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    allowlist_role user_role;
BEGIN
    -- Check if user is in allowlist and get their role
    SELECT get_allowlist_role(new.email) INTO allowlist_role;
    
    -- Insert user profile with allowlist role (or default to Student)
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(allowlist_role, 'Student'),
        now(),
        now()
    );
    
    -- Remove from allowlist if they were allowlisted
    DELETE FROM allowlist WHERE email = new.email;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 