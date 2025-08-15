-- =====================================================
-- SEED VITRINE TABLES WITH SAMPLE DATA
-- =====================================================

-- Insert sample courses
INSERT INTO courses_public (
  id, 
  name, 
  slug, 
  short_description, 
  long_description, 
  cta_text, 
  hero_image_url, 
  color_scheme,
  level,
  duration,
  price,
  features,
  is_active,
  order_index,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'Inglês Básico',
  'ingles-basico',
  'Aprenda inglês do básico ao intermediário com nossa metodologia inovadora e IA personalizada.',
  'Nosso curso de inglês básico é projetado para iniciantes que desejam aprender o idioma de forma eficaz e natural. Combinamos tecnologia de IA avançada com técnicas comprovadas de ensino para criar uma experiência personalizada que se adapta ao seu ritmo de aprendizado.',
  'Matricular-se Agora',
  '/images/courses/english-hero.jpg',
  'from-blue-500 to-blue-600',
  'Iniciante',
  '6 meses',
  'R$ 97/mês',
  '["Acesso vitalício ao curso", "Certificado de conclusão", "Suporte 24/7", "Acesso mobile e desktop", "Exercícios interativos", "Acompanhamento personalizado"]',
  true,
  1,
  NOW()
),
(
  gen_random_uuid(),
  'Espanhol Intermediário',
  'espanhol-intermediario',
  'Desenvolva fluência em espanhol e ganhe confiança para conversas reais em qualquer situação.',
  'O espanhol é um dos idiomas mais falados no mundo. Nosso curso intermediário oferece uma abordagem prática e cultural, permitindo que você se comunique com confiança em situações reais. Ideal para quem já tem conhecimentos básicos e quer avançar.',
  'Matricular-se Agora',
  '/images/courses/spanish-hero.jpg',
  'from-green-500 to-green-600',
  'Intermediário',
  '8 meses',
  'R$ 127/mês',
  '["Acesso vitalício ao curso", "Certificado de conclusão", "Suporte 24/7", "Acesso mobile e desktop", "Exercícios interativos", "Acompanhamento personalizado"]',
  true,
  2,
  NOW()
),
(
  gen_random_uuid(),
  'Francês Avançado',
  'frances-avancado',
  'Aprenda francês com nossa metodologia que combina a tradição do ensino francês com tecnologia moderna.',
  'Aprenda francês com nossa metodologia que combina a tradição do ensino francês com tecnologia moderna. Ideal para quem busca fluência em um dos idiomas mais elegantes do mundo. Foco em conversação avançada e cultura francesa.',
  'Matricular-se Agora',
  '/images/courses/french-hero.jpg',
  'from-purple-500 to-purple-600',
  'Avançado',
  '10 meses',
  'R$ 147/mês',
  '["Acesso vitalício ao curso", "Certificado de conclusão", "Suporte 24/7", "Acesso mobile e desktop", "Exercícios interativos", "Acompanhamento personalizado"]',
  true,
  3,
  NOW()
);

-- Insert sample course materials for English course
INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 1: Fundamentos',
  'Introdução ao inglês básico com foco em pronúncia e vocabulário essencial',
  '{"type": "module", "lessons": 4, "duration": "2 horas"}',
  1,
  NOW()
FROM courses_public c WHERE c.slug = 'ingles-basico';

INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 2: Gramática Essencial',
  'Conceitos fundamentais de gramática inglesa',
  '{"type": "module", "lessons": 4, "duration": "2.5 horas"}',
  2,
  NOW()
FROM courses_public c WHERE c.slug = 'ingles-basico';

INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 3: Conversação',
  'Prática de conversação em inglês para situações do dia a dia',
  '{"type": "module", "lessons": 4, "duration": "3 horas"}',
  3,
  NOW()
FROM courses_public c WHERE c.slug = 'ingles-basico';

-- Insert sample course materials for Spanish course
INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 1: Revisão e Fortalecimento',
  'Revisão de conceitos básicos e fortalecimento de fundamentos',
  '{"type": "module", "lessons": 4, "duration": "2.5 horas"}',
  1,
  NOW()
FROM courses_public c WHERE c.slug = 'espanhol-intermediario';

INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 2: Gramática Avançada',
  'Conceitos avançados de gramática espanhola',
  '{"type": "module", "lessons": 4, "duration": "3 horas"}',
  2,
  NOW()
FROM courses_public c WHERE c.slug = 'espanhol-intermediario';

-- Insert sample course materials for French course
INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 1: Perfeiçoamento',
  'Perfeiçoamento de habilidades avançadas em francês',
  '{"type": "module", "lessons": 4, "duration": "3 horas"}',
  1,
  NOW()
FROM courses_public c WHERE c.slug = 'frances-avancado';

INSERT INTO course_materials (
  id,
  course_id,
  title,
  description,
  content_type,
  order_index,
  created_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Módulo 2: Cultura e Literatura',
  'Imersão na cultura e literatura francesa',
  '{"type": "module", "lessons": 4, "duration": "3.5 horas"}',
  2,
  NOW()
FROM courses_public c WHERE c.slug = 'frances-avancado';
