-- =====================================================
-- STEP 2: SAFE SAMPLE DATA RECOVERY
-- =====================================================
-- This script ONLY INSERTS data - no destructive operations
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)

-- Step 1: Create default personas (safe - won't duplicate)
INSERT INTO personas (id, name, description, system_prompt, is_default, created_by, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Default Tutor', 'A helpful AI tutor that guides students through learning materials', 
'You are a knowledgeable and patient AI tutor. Your role is to help students understand complex concepts by:
1. Breaking down information into digestible parts
2. Providing clear explanations and examples  
3. Asking guiding questions to test understanding
4. Encouraging critical thinking
5. Being supportive and positive
6. Using the provided context from lessons and datasets to give accurate, relevant answers

Always be helpful, accurate, and educational in your responses.', 
true, (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO personas (id, name, description, system_prompt, is_default, created_by, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'Research Assistant', 'An AI assistant focused on helping with research and analysis',
'You are a research-focused AI assistant. Your primary function is to help students and educators with:
1. Analyzing documents and extracting key insights
2. Summarizing complex materials
3. Identifying patterns and connections across information
4. Providing detailed explanations of research methodologies
5. Helping organize and structure information
6. Suggesting additional research directions

Be thorough, analytical, and always cite your sources when referencing the provided materials.', 
false, (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO personas (id, name, description, system_prompt, is_default, created_by, created_at) VALUES
('33333333-3333-3333-3333-333333333333', 'Creative Writing Coach', 'An AI coach specialized in creative writing and storytelling',
'You are an experienced creative writing coach. Your expertise includes:
1. Helping students develop their writing voice and style
2. Providing feedback on narrative structure and character development
3. Offering writing prompts and exercises
4. Teaching various literary techniques and devices
5. Encouraging creativity while maintaining technical accuracy
6. Adapting your guidance to different writing genres and levels

Be inspiring, constructive, and always encourage creative expression while providing practical writing advice.', 
false, (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create default models (safe - won't duplicate)
INSERT INTO models (id, provider, name, engine, max_tokens, temperature, is_active, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'openai', 'GPT-4', 'gpt-4', 4096, 0.7, true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO models (id, provider, name, engine, max_tokens, temperature, is_active, created_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'openai', 'GPT-3.5 Turbo', 'gpt-3.5-turbo', 4096, 0.7, true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO models (id, provider, name, engine, max_tokens, temperature, is_active, created_at) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'anthropic', 'Claude 3 Sonnet', 'claude-3-sonnet-20240229', 4096, 0.7, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create sample module (safe - won't duplicate)
INSERT INTO modules (id, title, description, slug, is_published, order_index, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Introduction to BigStepLabs', 'Get started with the BigStepLabs platform and learn the fundamentals of AI-integrated learning', 'intro-bigsteplabs', true, 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create sample units (safe - won't duplicate)
INSERT INTO units (id, module_id, title, description, slug, status, order_index, estimated_duration_minutes, is_published, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Platform Overview', 'Learn about the key features and capabilities of BigStepLabs', 'platform-overview', 'pending', 1, 30, true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, module_id, title, description, slug, status, order_index, estimated_duration_minutes, is_published, created_at) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Working with AI Agents', 'Understand how to interact with AI agents for personalized learning', 'working-with-ai-agents', 'pending', 2, 45, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create sample content (safe - won't duplicate)
INSERT INTO content (id, unit_id, type, title, description, content, order_index, is_published, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'markdown', 'Welcome to BigStepLabs', 'An introduction to the platform', 
'# Welcome to BigStepLabs 2.0

BigStepLabs is an AI-integrated Learning Management System that combines structured educational content with intelligent conversational agents.

## Key Features

- **Modular Content Structure**: Organize learning materials into modules, units, and lessons
- **AI-Powered Agents**: Interact with specialized AI tutors trained on your content
- **Role-Based Access**: Different experiences for Admins, Collaborators, and Students
- **Rich Media Support**: Upload and manage PDFs, videos, audio, and more
- **Progress Tracking**: Monitor learning progress and engagement

## Getting Started

As a student, you can:
1. Browse available modules and units
2. Access learning materials and resources
3. Chat with AI agents for personalized help
4. Track your progress through the curriculum

Ready to explore? Let''s move on to the next unit!', 
1, true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO content (id, unit_id, type, title, description, content, order_index, is_published, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'markdown', 'Understanding AI Agents', 'Learn how AI agents work in BigStepLabs',
'# Understanding AI Agents

AI Agents in BigStepLabs are your personal learning companions, designed to help you understand complex topics and guide your learning journey.

## How AI Agents Work

Each agent combines:
- **Persona**: A specialized role (tutor, research assistant, writing coach, etc.)
- **Knowledge Base**: Datasets containing relevant information for your lessons
- **AI Model**: The underlying language model (GPT-4, Claude, etc.)

## Interacting with Agents

When you chat with an agent:
1. Ask questions about your current lesson or unit
2. Request explanations of complex concepts
3. Get help with assignments or projects
4. Explore related topics and ideas

## Agent Types

- **Default Tutor**: General-purpose educational assistance
- **Research Assistant**: Help with analysis and research tasks
- **Creative Writing Coach**: Specialized writing guidance and feedback

Ready to start chatting with an AI agent?', 
1, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create a default agent (safe - won't duplicate)
INSERT INTO agents (id, name, description, persona_id, model_id, created_by, is_active, created_at)
SELECT 
  'agent-1111-1111-1111-111111111111',
  'Default Learning Assistant',
  'A helpful AI assistant for general learning support',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  u.id,
  true,
  now()
FROM users u
WHERE u.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM agents a WHERE a.id = 'agent-1111-1111-1111-111111111111');

-- Step 7: Verify data was created (safe read-only operations)
SELECT 'Data Recovery Status' as check_type, 'Personas' as table_name, COUNT(*) as count FROM personas
UNION ALL
SELECT 'Data Recovery Status', 'Models', COUNT(*) FROM models
UNION ALL
SELECT 'Data Recovery Status', 'Modules', COUNT(*) FROM modules
UNION ALL
SELECT 'Data Recovery Status', 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Data Recovery Status', 'Content', COUNT(*) FROM content
UNION ALL
SELECT 'Data Recovery Status', 'Agents', COUNT(*) FROM agents;

-- Success message
SELECT 'Step 2: Sample data recovery completed safely!' as status;