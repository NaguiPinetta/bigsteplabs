-- =====================================================
-- BIGSTEPLABS DATABASE RESTORATION SCRIPT
-- =====================================================

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create custom types
CREATE TYPE user_role AS ENUM ('Admin', 'Collaborator', 'Student');
CREATE TYPE unit_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE content_type AS ENUM ('pdf', 'markdown', 'video', 'audio', 'embed', 'link');
CREATE TYPE chat_session_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Step 3: Create all tables
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Student',
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    slug TEXT UNIQUE,
    is_published BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT,
    status unit_status DEFAULT 'pending',
    order_index INTEGER DEFAULT 0,
    estimated_duration_minutes INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(module_id, slug)
);

CREATE TABLE IF NOT EXISTS content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    type content_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS datasets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    total_chunks INTEGER DEFAULT 0,
    processing_status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS content_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL,
    index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    char_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(dataset_id, index)
);

CREATE TABLE IF NOT EXISTS personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    user_id UUID REFERENCES users(id) NOT NULL,
    is_template BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    model_id UUID REFERENCES models(id) NOT NULL,
    persona_id UUID REFERENCES personas(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS unit_agents (
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    PRIMARY KEY (unit_id, agent_id)
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    agent_id UUID REFERENCES agents(id),
    unit_id UUID REFERENCES units(id),
    title TEXT,
    status chat_session_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    unit_id UUID REFERENCES units(id) NOT NULL,
    status unit_status DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, unit_id)
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_units_module_id ON units(module_id);
CREATE INDEX IF NOT EXISTS idx_content_unit_id ON content(unit_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_dataset_id ON content_chunks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);

-- Step 5: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 6: Create user trigger function
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

-- Step 7: Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 8: Insert seed data
-- Default personas
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
(SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), true, NOW()),

('22222222-2222-2222-2222-222222222222', 'Research Assistant', 'An AI assistant focused on helping with research and analysis',
'You are a research-focused AI assistant. Your primary function is to help students and educators with:
1. Analyzing documents and extracting key insights
2. Summarizing complex materials
3. Identifying patterns and connections across information
4. Providing detailed explanations of research methodologies
5. Helping organize and structure information
6. Suggesting additional research directions

Be thorough, analytical, and always cite your sources when referencing the provided materials.', 
(SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), false, NOW()),

('33333333-3333-3333-3333-333333333333', 'Creative Writing Coach', 'An AI coach specialized in creative writing and storytelling',
'You are an experienced creative writing coach. Your expertise includes:
1. Helping students develop their writing voice and style
2. Providing feedback on narrative structure and character development
3. Offering writing prompts and exercises
4. Teaching various literary techniques and devices
5. Encouraging creativity while maintaining technical accuracy
6. Adapting your guidance to different writing genres and levels

Be inspiring, constructive, and always encourage creative expression while providing practical writing advice.', 
(SELECT id FROM users WHERE email = 'jdpinetta@gmail.com' LIMIT 1), false, NOW());

-- Default models
INSERT INTO models (id, name, provider, model_id, description, is_active, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GPT-4', 'openai', 'gpt-4', 'OpenAI GPT-4 model for advanced reasoning and analysis', true, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'OpenAI GPT-3.5 Turbo for fast and efficient responses', true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Claude 3 Sonnet', 'anthropic', 'claude-3-sonnet-20240229', 'Anthropic Claude 3 Sonnet for detailed analysis', true, NOW());

-- Sample module
INSERT INTO modules (id, title, description, slug, is_published, order_index, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Introduction to BigStepLabs', 'Get started with the BigStepLabs platform and learn the fundamentals of AI-integrated learning', 'intro-bigsteplabs', true, 1, NOW());

-- Sample units
INSERT INTO units (id, module_id, title, description, slug, status, order_index, estimated_duration_minutes, is_published, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Platform Overview', 'Learn about the key features and capabilities of BigStepLabs', 'platform-overview', 'pending', 1, 30, true, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Working with AI Agents', 'Understand how to interact with AI agents for personalized learning', 'working-with-ai-agents', 'pending', 2, 45, true, NOW());

-- Sample content
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
- **Creative Writing Coach**: Specialized writing guidance and feedback

Ready to start chatting with an AI agent?', 
1, true, NOW());

-- Step 9: Create admin user in auth.users (if not exists)
-- Note: This needs to be done through Supabase Auth API or Dashboard
-- The trigger will automatically create the user record when they sign up

-- Step 10: Enable RLS and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can add more specific ones later)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read access to published modules" ON modules FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access to modules" ON modules FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Public read access to published units" ON units FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access to units" ON units FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

CREATE POLICY "Public read access to published content" ON content FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access to content" ON content FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Step 11: Create admin user record (if auth user exists)
INSERT INTO users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'Admin',
  now(),
  now()
FROM auth.users au
WHERE au.email = 'jdpinetta@gmail.com'
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id);

-- Step 12: Create sample agent
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
SELECT 'Database restoration completed successfully!' as status;