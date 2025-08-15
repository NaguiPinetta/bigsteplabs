-- =====================================================
-- DIAGNOSTIC: Check Available Functions
-- Run this to see what's available in your Supabase
-- =====================================================

-- Check if uuid-ossp extension exists
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- Check if gen_random_uuid function exists
SELECT 
  proname as function_name,
  prosrc as source
FROM pg_proc 
WHERE proname = 'gen_random_uuid';

-- Check if uuid_generate_v4 function exists
SELECT 
  proname as function_name,
  prosrc as source
FROM pg_proc 
WHERE proname = 'uuid_generate_v4';

-- Check available UUID functions
SELECT 
  proname as function_name
FROM pg_proc 
WHERE proname LIKE '%uuid%';

-- Check what extensions are available
SELECT extname as available_extensions
FROM pg_extension
ORDER BY extname;
