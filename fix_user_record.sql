-- =====================================================
-- FIX USER RECORD SCRIPT
-- =====================================================

-- Step 1: Create the user record for the existing auth user
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'jdpinetta@gmail.com' THEN 'Admin'
    ELSE 'Student'
  END,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

-- Step 2: Verify the user was created
SELECT 
  u.id,
  u.email,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'jdpinetta@gmail.com';

-- Step 3: Create sample personas for the admin user
INSERT INTO personas (id, name, description, instructions, user_id, is_template, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Default Tutor', 'A helpful AI tutor that guides students through learning materials', 
'You are a knowledgeable and patient AI tutor. Your role is to help students understand complex concepts by:
1. Breaking down information into digestible parts
2. Providing clear explanations and examples  
3. Asking guiding questions to test understanding
4. Encouraging critical thinking
5. Being supportive and positive
6. Using the provided context from lessons and datasets to give accurate, relevant answers

Always be helpful, accurate, and educational in your responses.', 
(SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create default models
INSERT INTO models (id, name, provider, model_id, description, is_active, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GPT-4', 'openai', 'gpt-4', 'OpenAI GPT-4 model for advanced reasoning and analysis', true, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'OpenAI GPT-3.5 Turbo for fast and efficient responses', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create sample module and units
INSERT INTO modules (id, title, description, slug, is_published, order_index, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Introduction to BigStepLabs', 'Get started with the BigStepLabs platform and learn the fundamentals of AI-integrated learning', 'intro-bigsteplabs', true, 1, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, module_id, title, description, slug, status, order_index, estimated_duration_minutes, is_published, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Platform Overview', 'Learn about the key features and capabilities of BigStepLabs', 'platform-overview', 'pending', 1, 30, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create a default agent
INSERT INTO agents (id, name, description, instructions, model_id, persona_id, user_id, is_active, created_at)
SELECT 
  'agent-1111-1111-1111-111111111111',
  'Default Learning Assistant',
  'A helpful AI assistant for general learning support',
  'You are a knowledgeable and patient AI tutor. Help students understand concepts and guide their learning journey.',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  u.id,
  true,
  now()
FROM users u
WHERE u.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM agents a WHERE a.id = 'agent-1111-1111-1111-111111111111');

-- Success message
SELECT 'User record created successfully!' as status;