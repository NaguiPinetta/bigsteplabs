-- =====================================================
-- STEP 1: SAFE USER RECOVERY
-- =====================================================
-- This script ONLY INSERTS data - no destructive operations
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)

-- Step 1: Create the user record for the existing auth user
-- This is safe because it only inserts if the user doesn't exist
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'jdpinetta@gmail.com' THEN 'Admin'::user_role
    ELSE 'Student'::user_role
  END,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

-- Step 2: Verify the user was created (safe read-only operation)
SELECT 
  'User Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User record exists' 
    ELSE '❌ User record missing' 
  END as status,
  COUNT(*) as user_count
FROM public.users 
WHERE email = 'jdpinetta@gmail.com';

-- Success message
SELECT 'Step 1: User recovery completed safely!' as status;