import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { supabaseAdmin } from "$lib/server/supabase-admin";

// Fallback course data (same as in the store)
const fallbackCourses = [
  {
    id: "1",
    name: "Inglês",
    slug: "ingles-basico",
    short_description:
      "Expanda seu domínio do inglês com cursos abrangentes; domine a língua global e abra portas para um futuro brilhante.",
    long_description:
      "Aprenda inglês com nossa metodologia inovadora que combina aulas personalizadas, foco em fluência e conversação, preparação para testes de proficiência (TOEFL, IELTS, Cambridge English) e material didático exclusivo incluindo o Livro de Inglês da BigStep e 'English for Everyone'.",
    cta_text: "Começar Agora",
    hero_image_url: "/images/courses/english-hero.jpg",
    flag_image_url: "/images/flags/usa-flag.png",
    features: [
      "Aulas Personalizadas (particulares ou em grupo)",
      "Fluência e Preparação para Entrevistas",
      "Preparação para TOEFL, IELTS e Cambridge",
      "Material Didático Exclusivo BigStep",
    ],
    duration: "6-12 meses",
    level: "Iniciante ao Avançado",
    price: "A partir de R$ 299/mês",
    color_scheme: "from-blue-500 to-blue-600",
    is_active: true,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Alemão",
    slug: "alemao",
    short_description:
      "Descubra o idioma alemão com cursos especializados; amplie suas oportunidades pessoais e profissionais.",
    long_description:
      "Aprenda alemão com cursos especializados que incluem aulas personalizadas individuais ou em grupo, cursos intensivos para imigração, preparação para TestDaF, DSH, ÖSD e Goethe-Zertifikat, e material didático exclusivo incluindo 'Aspekte', 'Momente' e 'BigStep Deutsch'.",
    cta_text: "Começar Agora",
    hero_image_url: "/images/courses/german-hero.jpg",
    flag_image_url: "/images/flags/german-flag.png",
    features: [
      "Aulas Personalizadas (individuais ou em grupo)",
      "Cursos Intensivos para Imigração",
      "Preparação para TestDaF, DSH, ÖSD e Goethe",
      "Material Didático Exclusivo BigStep",
    ],
    duration: "8-14 meses",
    level: "Iniciante ao Avançado",
    price: "A partir de R$ 349/mês",
    color_scheme: "from-gray-800 to-gray-900",
    is_active: true,
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Espanhol",
    slug: "espanhol",
    short_description:
      "Aprenda espanhol de forma dinâmica e envolvente; desenvolva habilidades comunicativas e mergulhe na cultura hispânica.",
    long_description:
      "Aprenda espanhol de forma dinâmica com aulas personalizadas individuais ou em grupo, foco em fluência e preparação para entrevistas, preparação para DELE e CELU (útil para UBA e pós-graduação na Espanha), e material didático de alta qualidade incluindo 'Español en Marcha', 'Nuevo Ven' e 'Aula Internacional'.",
    cta_text: "Começar Agora",
    hero_image_url: "/images/courses/spanish-hero.jpg",
    flag_image_url: "/images/flags/spain-flag.png",
    features: [
      "Aulas Personalizadas (individuais ou em grupo)",
      "Fluência e Preparação para Entrevistas",
      "Preparação para DELE e CELU",
      "Material Didático de Alta Qualidade",
    ],
    duration: "8-14 meses",
    level: "Iniciante ao Avançado",
    price: "A partir de R$ 349/mês",
    color_scheme: "from-green-500 to-green-600",
    is_active: true,
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Italiano",
    slug: "italiano",
    short_description:
      "Descubra a língua italiana com cursos especializados; amplie suas oportunidades pessoais e profissionais.",
    long_description:
      "Aprenda italiano com cursos especializados que incluem aulas personalizadas individuais ou em grupo, cursos intensivos para emprego e desenvolvimento de carreira, preparação para CILS e CELI, e material didático exclusivo incluindo 'Al Dente' e 'BigStep Italiano'.",
    cta_text: "Começar Agora",
    hero_image_url: "/images/courses/italian-hero.jpg",
    flag_image_url: "/images/flags/italy-flag.png",
    features: [
      "Aulas Personalizadas (individuais ou em grupo)",
      "Cursos Intensivos para Carreira",
      "Preparação para CILS e CELI",
      "Material Didático Exclusivo BigStep",
    ],
    duration: "8-14 meses",
    level: "Iniciante ao Avançado",
    price: "A partir de R$ 349/mês",
    color_scheme: "from-green-600 to-green-700",
    is_active: false,
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Francês",
    slug: "frances",
    short_description:
      "Descubra a língua francesa com cursos especializados; amplie suas oportunidades pessoais e profissionais.",
    long_description:
      "Aprenda francês com cursos especializados que incluem aulas personalizadas individuais ou em grupo, cursos intensivos para emprego e crescimento pessoal, preparação para DELF e DALF, e material didático exclusivo incluindo 'Odyssee' e 'BigStep Francês'.",
    cta_text: "Começar Agora",
    hero_image_url: "/images/courses/french-hero.jpg",
    flag_image_url: "/images/flags/france-flag.png",
    features: [
      "Aulas Personalizadas (individuais ou em grupo)",
      "Cursos Intensivos para Carreira",
      "Preparação para DELF e DALF",
      "Material Didático Exclusivo BigStep",
    ],
    duration: "8-14 meses",
    level: "Iniciante ao Avançado",
    price: "A partir de R$ 349/mês",
    color_scheme: "from-purple-500 to-purple-600",
    is_active: false,
    order_index: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const load: PageServerLoad = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      throw error(404, "Course not found");
    }

    // Try to get course data from database first
    try {
      const { data: course, error: courseError } = await supabaseAdmin
        .from("courses_public")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (courseError || !course) {
        throw error(404, "Course not found");
      }

      // Get course materials
      const { data: materials, error: materialsError } = await supabaseAdmin
        .from("course_materials")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index");

      if (materialsError) {
        console.error("Error loading course materials:", materialsError);
      }

      return {
        course: {
          ...course,
          materials: materials || [],
        },
      };
    } catch (dbError) {
      // If database is not available, use fallback data
      console.log("Database not available, using fallback data");

      const fallbackCourse = fallbackCourses.find(
        (c) => c.slug === slug && c.is_active
      );

      if (!fallbackCourse) {
        throw error(404, "Course not found");
      }

      return {
        course: {
          ...fallbackCourse,
          materials: [],
        },
      };
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Course not found")) {
      throw error(404, "Course not found");
    }

    console.error("Error loading course:", err);
    throw error(500, "Internal server error");
  }
};
