-- =====================================================
-- SIMPLE VITRINE TABLE CREATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create courses_public table
CREATE TABLE IF NOT EXISTS courses_public (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  hero_image_url TEXT,
  flag_image_url TEXT,
  features JSONB DEFAULT '[]',
  duration TEXT NOT NULL,
  level TEXT NOT NULL,
  price TEXT NOT NULL,
  color_scheme TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create course_materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses_public(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT DEFAULT 'book',
  file_url TEXT,
  external_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'website',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses_public(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public_is_active ON courses_public(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);

-- Enable RLS
ALTER TABLE courses_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public courses are viewable by everyone" ON courses_public
  FOR SELECT USING (true);

CREATE POLICY "Course materials are viewable by everyone" ON course_materials
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create prospects" ON prospects
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON courses_public TO anon, authenticated;
GRANT ALL ON course_materials TO anon, authenticated;
GRANT ALL ON prospects TO anon, authenticated;

-- Success message
SELECT 'Vitrine tables created successfully!' as status;
