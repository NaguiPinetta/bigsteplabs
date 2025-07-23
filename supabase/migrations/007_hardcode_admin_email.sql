-- Hardcode admin access for specific email
-- Update the trigger function to automatically assign Admin role to specific email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'jdpinetta@gmail.com' THEN 'Admin'
      ELSE 'Student'
    END,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing user to Admin role
UPDATE public.users 
SET role = 'Admin' 
WHERE email = 'jdpinetta@gmail.com'; 