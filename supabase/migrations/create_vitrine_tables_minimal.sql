-- =====================================================
-- MINIMAL VITRINE TABLE CREATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create courses_public table
CREATE TABLE IF NOT EXISTS courses_public (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  hero_image_url TEXT,
  flag_image_url TEXT,
  features TEXT DEFAULT '[]',
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
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses_public(id) ON DELETE CASCADE NOT NULL,
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
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'website',
  metadata TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses_public(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public_is_active ON courses_public(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);

-- Success message
SELECT 'Vitrine tables created successfully with minimal configuration!' as status;
