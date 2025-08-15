-- =====================================================
-- QUICK FIX: Create Missing Tables for BigStepLabs
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create courses_public table
CREATE TABLE IF NOT EXISTS courses_public (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  hero_image_url TEXT,
  flag_image_url TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  duration TEXT NOT NULL,
  level TEXT NOT NULL,
  price TEXT NOT NULL,
  color_scheme TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses_public(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT DEFAULT 'book' CHECK (material_type IN ('book', 'video', 'audio', 'document', 'link')),
  file_url TEXT,
  external_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prospects table for contact form
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source TEXT DEFAULT 'website',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Student' CHECK (role IN ('Admin', 'Collaborator', 'Student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample course data
INSERT INTO courses_public (name, slug, short_description, long_description, cta_text, hero_image_url, flag_image_url, features, duration, level, price, color_scheme, is_active, order_index) VALUES
('English Course', 'english', 'Master English with AI-powered learning', 'Comprehensive English course designed for real-world success using advanced AI technology.', 'Start Learning English', '/images/courses/english-hero.jpg', '/images/flags/en.svg', '["AI-powered lessons", "Interactive exercises", "Real-time feedback", "Progress tracking"]', '6 months', 'Beginner to Advanced', 'Free', 'blue', true, 1),
('German Course', 'german', 'Learn German with native-level precision', 'Expert German course with cultural insights and practical conversation skills.', 'Start Learning German', '/images/courses/german-hero.jpg', '/images/flags/de.svg', '["Native pronunciation", "Cultural context", "Grammar mastery", "Conversation practice"]', '8 months', 'Beginner to Intermediate', 'Free', 'red', true, 2),
('Spanish Course', 'spanish', 'Speak Spanish confidently', 'Comprehensive Spanish course focusing on practical communication and cultural understanding.', 'Start Learning Spanish', '/images/courses/spanish-hero.jpg', '/images/flags/es.svg', '["Practical communication", "Cultural insights", "Grammar foundation", "Speaking confidence"]', '7 months', 'Beginner to Advanced', 'Free', 'yellow', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses_public(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public_is_active ON courses_public(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE courses_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public courses are viewable by everyone" ON courses_public
  FOR SELECT USING (true);

CREATE POLICY "Course materials are viewable by everyone" ON course_materials
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create prospects" ON prospects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Update the updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_public_updated_at BEFORE UPDATE ON courses_public
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_materials_updated_at BEFORE UPDATE ON course_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database tables created successfully! You can now log in.' as status;
