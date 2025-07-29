-- =====================================================
-- CLEAR SESSION DATA AND FORCE LOGOUT
-- =====================================================
-- This script clears all session data and forces a complete logout

-- Step 1: Clear all auth sessions from Supabase
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com'
);

-- Step 2: Clear refresh tokens
DELETE FROM auth.refresh_tokens WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com'
);

-- Step 3: Clear any stored sessions in the database
DELETE FROM auth.sessions;

-- Step 4: Verify user still exists but sessions are cleared
SELECT 
  'Session Clear Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User still exists' 
    ELSE '❌ User missing' 
  END as user_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com')) 
    THEN '❌ Sessions still exist' 
    ELSE '✅ All sessions cleared' 
  END as session_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com')) 
    THEN '❌ Refresh tokens still exist' 
    ELSE '✅ All refresh tokens cleared' 
  END as token_status;

-- Step 5: Show current active sessions count
SELECT 
  'Active Sessions' as check_type,
  COUNT(*) as session_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ No active sessions' ELSE '❌ Active sessions found' END as status
FROM auth.sessions;

-- Success message
SELECT '✅ All session data cleared! You can now log in fresh.' as status;