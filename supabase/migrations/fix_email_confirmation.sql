-- =====================================================
-- FIX EMAIL CONFIRMATION ISSUE
-- =====================================================

-- Option 1: Update the existing user to have confirmed email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'naguipinetta@gmail.com';

-- Option 2: If you want to disable email confirmation globally
-- (This requires admin access to Supabase dashboard)
-- Go to: Authentication > Settings > Email Auth > Disable "Enable email confirmations"

-- Option 3: Create a new user without email confirmation
-- (This will be handled by the updated create-user API)

-- Verify the fix
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '❌ Email Not Confirmed'
  END as status
FROM auth.users 
WHERE email = 'naguipinetta@gmail.com';

-- Success message
SELECT '✅ Email confirmation fixed! User should now be able to login.' as status;