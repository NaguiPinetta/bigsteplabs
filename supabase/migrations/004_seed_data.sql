-- Insert default personas
INSERT INTO personas (id, name, description, system_prompt, is_default, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Default Tutor', 'A helpful AI tutor that guides students through learning materials', 
'You are a knowledgeable and patient AI tutor. Your role is to help students understand complex concepts by:
1. Breaking down information into digestible parts
2. Providing clear explanations and examples  
3. Asking guiding questions to test understanding
4. Encouraging critical thinking
5. Being supportive and positive
6. Using the provided context from lessons and datasets to give accurate, relevant answers

Always be helpful, accurate, and educational in your responses.', true, NOW()),

('22222222-2222-2222-2222-222222222222', 'Research Assistant', 'An AI assistant focused on helping with research and analysis',
'You are a research-focused AI assistant. Your primary function is to help students and educators with:
1. Analyzing documents and extracting key insights
2. Summarizing complex materials
3. Identifying patterns and connections across information
4. Providing detailed explanations of research methodologies
5. Helping organize and structure information
6. Suggesting additional research directions

Be thorough, analytical, and always cite your sources when referencing the provided materials.', false, NOW()),

('33333333-3333-3333-3333-333333333333', 'Creative Writing Coach', 'An AI coach specialized in creative writing and storytelling',
'You are an experienced creative writing coach. Your expertise includes:
1. Helping students develop their writing voice and style
2. Providing feedback on narrative structure and character development
3. Offering writing prompts and exercises
4. Teaching various literary techniques and devices
5. Encouraging creativity while maintaining technical accuracy
6. Adapting your guidance to different writing genres and levels

Be inspiring, constructive, and always encourage creative expression while providing practical writing advice.', false, NOW());

-- Insert default models
INSERT INTO models (id, provider, name, engine, max_tokens, temperature, is_active, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'openai', 'GPT-4', 'gpt-4', 4096, 0.7, true, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'openai', 'GPT-3.5 Turbo', 'gpt-3.5-turbo', 4096, 0.7, true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'anthropic', 'Claude 3 Sonnet', 'claude-3-sonnet-20240229', 4096, 0.7, true, NOW());

-- Create sample module
INSERT INTO modules (id, title, description, slug, is_published, order_index, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Introduction to BigStepLabs', 'Get started with the BigStepLabs platform and learn the fundamentals of AI-integrated learning', 'intro-bigsteplabs', true, 1, NOW());

-- Create sample units
INSERT INTO units (id, module_id, title, description, slug, status, order_index, estimated_duration_minutes, is_published, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Platform Overview', 'Learn about the key features and capabilities of BigStepLabs', 'platform-overview', 'pending', 1, 30, true, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Working with AI Agents', 'Understand how to interact with AI agents for personalized learning', 'working-with-ai-agents', 'pending', 2, 45, true, NOW());

-- Create sample content
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
1, true, NOW()),

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
- **Creative Writing Coach**: Specialized guidance for writing projects

## Best Practices

- Be specific in your questions
- Provide context about what you''re learning
- Ask for clarification when needed
- Use agents to explore topics beyond your current lesson

Ready to start chatting with an AI agent?', 
1, true, NOW());

-- Create a sample agent using the default persona and model
INSERT INTO agents (id, name, description, persona_id, model_id, dataset_ids, is_active, created_at) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Introduction Tutor', 'An AI tutor specialized in helping students understand BigStepLabs platform basics', 
'11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}', true, NOW());

-- Assign the agent to the sample units
INSERT INTO unit_agents (unit_id, agent_id, is_active, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'gggggggg-gggg-gggg-gggg-gggggggggggg', true, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg', true, NOW()); 