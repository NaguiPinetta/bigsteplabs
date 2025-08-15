-- =====================================================
-- MANUAL TABLE CREATION: Only Missing Vitrine Tables
-- Run this in your Supabase SQL Editor
-- This preserves your existing working schema
-- =====================================================

-- Create courses_public table (for marketing site)
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

-- Create course_materials table (for course content)
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

-- Create prospects table (for contact form)
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

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses_public(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public_is_active ON courses_public(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);

-- Enable Row Level Security (RLS)
ALTER TABLE courses_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for vitrine)
CREATE POLICY "Public courses are viewable by everyone" ON courses_public
  FOR SELECT USING (true);

CREATE POLICY "Course materials are viewable by everyone" ON course_materials
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create prospects" ON prospects
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON courses_public TO anon, authenticated;
GRANT ALL ON course_materials TO anon, authenticated;
GRANT ALL ON prospects TO anon, authenticated;

-- Success message
SELECT 'Vitrine tables created successfully! Your existing schema is preserved.' as status;
