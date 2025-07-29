-- =====================================================
-- STEP 4: TEST LOGIN READINESS
-- =====================================================
-- This script ONLY READS data - completely safe
-- Use this to verify everything is ready before testing login

-- Step 1: Check if user exists in both auth and public tables
SELECT 
  'User Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User exists in auth.users' 
    ELSE '❌ User missing from auth.users' 
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'jdpinetta@gmail.com') 
    THEN '✅ User exists in public.users' 
    ELSE '❌ User missing from public.users' 
  END as public_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'jdpinetta@gmail.com' AND role = 'Admin') 
    THEN '✅ User has Admin role' 
    ELSE '❌ User missing Admin role' 
  END as role_status;

-- Step 2: Check data availability
SELECT 
  'Data Availability' as check_type,
  'Personas' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END as status
FROM personas
UNION ALL
SELECT 
  'Data Availability', 'Models', COUNT(*), 
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END
FROM models
UNION ALL
SELECT 
  'Data Availability', 'Modules', COUNT(*), 
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END
FROM modules
UNION ALL
SELECT 
  'Data Availability', 'Units', COUNT(*), 
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END
FROM units
UNION ALL
SELECT 
  'Data Availability', 'Content', COUNT(*), 
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END
FROM content
UNION ALL
SELECT 
  'Data Availability', 'Agents', COUNT(*), 
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '❌ No data' END
FROM agents;

-- Step 3: Check RLS policies
SELECT 
  'RLS Policies' as check_type,
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Policies exist' ELSE '❌ No policies' END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'modules', 'units', 'content', 'personas', 'models', 'agents', 'datasets', 'chat_sessions', 'messages')
GROUP BY tablename
ORDER BY tablename;

-- Step 4: Check if user can access their own data (simulate RLS)
SELECT 
  'RLS Simulation' as check_type,
  'User can access own record' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'jdpinetta@gmail.com' 
      AND id = (SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com' LIMIT 1)
    ) 
    THEN '✅ User record accessible' 
    ELSE '❌ User record not accessible' 
  END as status;

-- Step 5: Final readiness assessment
SELECT 
  'Login Readiness' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'jdpinetta@gmail.com')
    AND EXISTS (SELECT 1 FROM public.users WHERE email = 'jdpinetta@gmail.com' AND role = 'Admin')
    AND EXISTS (SELECT 1 FROM personas WHERE is_template = true)
    AND EXISTS (SELECT 1 FROM models WHERE is_active = true)
    THEN '✅ READY FOR LOGIN TEST'
    ELSE '❌ NOT READY - Run previous scripts first'
  END as final_status;

-- Success message
SELECT 'Step 4: Login readiness test completed!' as status;