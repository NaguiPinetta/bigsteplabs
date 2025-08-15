-- =====================================================
-- CREATE VITRINE TABLES FOR MARKETING SITE
-- =====================================================

-- Create prospects table for lead capture
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

-- Create course_materials table for course content
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses_public(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public_order_index ON courses_public(order_index);
CREATE INDEX IF NOT EXISTS idx_courses_public_is_active ON courses_public(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_order_index ON course_materials(order_index);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_courses_public_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_course_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospects_updated_at_trigger
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_prospects_updated_at();

CREATE TRIGGER update_courses_public_updated_at_trigger
  BEFORE UPDATE ON courses_public
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_public_updated_at();

CREATE TRIGGER update_course_materials_updated_at_trigger
  BEFORE UPDATE ON course_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_course_materials_updated_at();

-- Enable RLS on all tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prospects table
-- Anyone can insert prospects (lead capture)
CREATE POLICY "Anyone can insert prospects" ON prospects
  FOR INSERT WITH CHECK (true);

-- Only admins can view and manage prospects
CREATE POLICY "Admins can view all prospects" ON prospects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );

CREATE POLICY "Admins can update prospects" ON prospects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );

CREATE POLICY "Admins can delete prospects" ON prospects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );

-- RLS Policies for courses_public table
-- Anyone can view active courses
CREATE POLICY "Anyone can view active courses" ON courses_public
  FOR SELECT USING (is_active = true);

-- Only admins can manage courses
CREATE POLICY "Admins can manage courses" ON courses_public
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );

-- RLS Policies for course_materials table
-- Anyone can view materials for active courses
CREATE POLICY "Anyone can view materials for active courses" ON course_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses_public
      WHERE courses_public.id = course_materials.course_id
      AND courses_public.is_active = true
    )
  );

-- Only admins can manage materials
CREATE POLICY "Admins can manage materials" ON course_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );

-- Insert sample data for courses_public
INSERT INTO courses_public (name, slug, short_description, long_description, cta_text, hero_image_url, features, duration, level, price, color_scheme, order_index) VALUES
(
  'Inglês',
  'ingles',
  'Aprenda inglês com nossa metodologia inovadora e tecnologia de IA.',
  'Nosso curso de inglês é projetado para adultos que desejam aprender o idioma de forma eficaz e natural. Combinamos tecnologia de IA avançada com técnicas comprovadas de ensino para criar uma experiência personalizada.',
  'Começar Agora',
  '/images/courses/english-hero.jpg',
  '["Aulas personalizadas baseadas no seu nível", "Conversação natural desde a primeira aula", "Preparação para testes de proficiência", "Material didático interativo", "Suporte 24/7 via plataforma"]',
  '6-12 meses',
  'Iniciante ao Avançado',
  'A partir de R$ 299/mês',
  'from-blue-500 to-blue-600',
  1
),
(
  'Espanhol',
  'espanhol',
  'Domine o espanhol com aulas personalizadas e conversação natural.',
  'O espanhol é um dos idiomas mais falados no mundo. Nosso curso oferece uma abordagem prática e cultural, permitindo que você se comunique com confiança em situações reais.',
  'Começar Agora',
  '/images/courses/spanish-hero.jpg',
  '["Professores nativos e certificados", "Foco em conversação e cultura", "Preparação para exames DELE", "Aulas presenciais e online", "Grupos de conversação semanais"]',
  '6-12 meses',
  'Iniciante ao Avançado',
  'A partir de R$ 299/mês',
  'from-green-500 to-green-600',
  2
),
(
  'Francês',
  'frances',
  'Descubra a elegância do francês com nossa abordagem única.',
  'Aprenda francês com nossa metodologia que combina a tradição do ensino francês com tecnologia moderna. Ideal para quem busca fluência em um dos idiomas mais elegantes do mundo.',
  'Começar Agora',
  '/images/courses/french-hero.jpg',
  '["Metodologia baseada no CEFR", "Preparação para exames DELF/DALF", "Aulas com foco em pronúncia", "Material cultural autêntico", "Imersão na cultura francesa"]',
  '8-14 meses',
  'Iniciante ao Avançado',
  'A partir de R$ 349/mês',
  'from-purple-500 to-purple-600',
  3
);

-- Insert sample data for course_materials
INSERT INTO course_materials (course_id, title, description, material_type, order_index, is_required) VALUES
(
  (SELECT id FROM courses_public WHERE slug = 'ingles'),
  'English Grammar in Use',
  'Livro de gramática essencial para estudantes de inglês',
  'book',
  1,
  true
),
(
  (SELECT id FROM courses_public WHERE slug = 'ingles'),
  'Oxford Advanced Learner''s Dictionary',
  'Dicionário avançado para consulta durante os estudos',
  'book',
  2,
  false
),
(
  (SELECT id FROM courses_public WHERE slug = 'espanhol'),
  'Gramática de la Lengua Española',
  'Gramática completa da língua espanhola',
  'book',
  1,
  true
),
(
  (SELECT id FROM courses_public WHERE slug = 'espanhol'),
  'Diccionario de la Real Academia Española',
  'Dicionário oficial da Real Academia Espanhola',
  'book',
  2,
  false
),
(
  (SELECT id FROM courses_public WHERE slug = 'frances'),
  'Grammaire Progressive du Français',
  'Gramática progressiva do francês',
  'book',
  1,
  true
),
(
  (SELECT id FROM courses_public WHERE slug = 'frances'),
  'Le Petit Robert',
  'Dicionário monolíngue francês',
  'book',
  2,
  false
);
