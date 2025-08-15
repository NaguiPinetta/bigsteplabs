import { writable, derived } from "svelte/store";
import { supabase } from "$lib/supabase";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";
import type {
  CoursePublic,
  CourseMaterial,
  Prospect,
  CourseWithMaterials,
} from "$lib/types/database";

// Store for public courses
export const coursesPublic = writable<CoursePublic[]>([]);
export const coursesLoading = writable(true);
export const coursesError = writable<string | null>(null);

// Store for course materials
export const courseMaterials = writable<CourseMaterial[]>([]);

// Store for prospects (leads)
export const prospects = writable<Prospect[]>([]);
export const prospectsLoading = writable(false);
export const prospectsError = writable<string | null>(null);

// Derived store for courses with materials
export const coursesWithMaterials = derived(
  [coursesPublic, courseMaterials],
  ([$courses, $materials]) => {
    return $courses.map((course) => ({
      ...course,
      materials: $materials.filter(
        (material) => material.course_id === course.id
      ),
    })) as CourseWithMaterials[];
  }
);

// Load public courses
export async function loadPublicCourses() {
  try {
    console.log("Loading public courses...");
    console.log("Supabase URL:", PUBLIC_SUPABASE_URL);
    console.log("Supabase Anon Key exists:", !!PUBLIC_SUPABASE_ANON_KEY);

    coursesLoading.set(true);
    coursesError.set(null);

    const { data, error } = await supabase
      .from("courses_public")
      .select("*")
      .order("order_index");

    if (error) {
      console.log("Supabase error:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);

      // If table doesn't exist, use fallback data
      if (error.code === "42P01") {
        console.log("Table not found, using fallback data");
        // Table doesn't exist
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
        console.log("Setting fallback courses:", fallbackCourses);
        coursesPublic.set(fallbackCourses);
        coursesLoading.set(false);
        console.log("Fallback courses set, loading state set to false");
        return;
      }
      throw error;
    }

    console.log("Supabase data received:", data);
    coursesPublic.set(data || []);
  } catch (error) {
    console.error("Error loading public courses:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
    }
    coursesError.set(
      error instanceof Error ? error.message : "Failed to load courses"
    );
  } finally {
    console.log("Setting loading state to false");
    coursesLoading.set(false);
  }
}

// Load course materials for a specific course
export async function loadCourseMaterials(courseId: string) {
  try {
    const { data, error } = await supabase
      .from("course_materials")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");

    if (error) {
      throw error;
    }

    courseMaterials.set(data || []);
  } catch (error) {
    console.error("Error loading course materials:", error);
  }
}

// Load course materials for all courses
export async function loadAllCourseMaterials() {
  try {
    const { data, error } = await supabase
      .from("course_materials")
      .select("*")
      .order("course_id, order_index");

    if (error) {
      // If table doesn't exist, use fallback data
      if (error.code === "42P01") {
        // Table doesn't exist
        console.warn("course_materials table not found, using fallback data");
        const fallbackMaterials = [
          {
            id: "1",
            course_id: "1",
            title: "English Grammar in Use",
            description:
              "Livro de gramática essencial para estudantes de inglês",
            material_type: "book",
            file_url: null,
            external_url: null,
            order_index: 1,
            is_required: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            course_id: "2",
            title: "Gramática de la Lengua Española",
            description: "Gramática completa da língua espanhola",
            material_type: "book",
            file_url: null,
            external_url: null,
            order_index: 1,
            is_required: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "3",
            course_id: "3",
            title: "Grammaire Progressive du Français",
            description: "Gramática progressiva do francês",
            material_type: "book",
            file_url: null,
            external_url: null,
            order_index: 1,
            is_required: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        courseMaterials.set(fallbackMaterials);
        return;
      }
      console.error("Error loading all course materials:", error);
    }

    courseMaterials.set(data || []);
  } catch (error) {
    console.error("Error loading all course materials:", error);
  }
}

// Get a specific course by slug
export async function getCourseBySlug(
  slug: string
): Promise<CoursePublic | null> {
  try {
    const { data, error } = await supabase
      .from("courses_public")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      // If table doesn't exist, use fallback data
      if (error.code === "42P01") {
        // Table doesn't exist
        console.warn("courses_public table not found, using fallback data");
        const fallbackCourses = [
          {
            id: "1",
            name: "Inglês",
            slug: "ingles",
            short_description:
              "Aprenda inglês com nossa metodologia inovadora e tecnologia de IA.",
            long_description:
              "Nosso curso de inglês é projetado para adultos que desejam aprender o idioma de forma eficaz e natural.",
            cta_text: "Começar Agora",
            hero_image_url: "/images/courses/english-hero.jpg",
            features: [
              "Aulas personalizadas",
              "Conversação natural",
              "Preparação para testes",
              "Material interativo",
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
            name: "Espanhol",
            slug: "espanhol",
            short_description:
              "Domine o espanhol com aulas personalizadas e conversação natural.",
            long_description:
              "O espanhol é um dos idiomas mais falados no mundo. Nosso curso oferece uma abordagem prática e cultural.",
            cta_text: "Começar Agora",
            hero_image_url: "/images/courses/spanish-hero.jpg",
            features: [
              "Professores nativos",
              "Foco em conversação",
              "Preparação para exames DELE",
              "Aulas presenciais e online",
            ],
            duration: "6-12 meses",
            level: "Iniciante ao Avançado",
            price: "A partir de R$ 299/mês",
            color_scheme: "from-green-500 to-green-600",
            is_active: true,
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Francês",
            slug: "frances",
            short_description:
              "Descubra a elegância do francês com nossa abordagem única.",
            long_description:
              "Aprenda francês com nossa metodologia que combina a tradição do ensino francês com tecnologia moderna.",
            cta_text: "Começar Agora",
            hero_image_url: "/images/courses/french-hero.jpg",
            features: [
              "Metodologia CEFR",
              "Preparação para exames DELF/DALF",
              "Foco em pronúncia",
              "Material cultural autêntico",
            ],
            duration: "8-14 meses",
            level: "Iniciante ao Avançado",
            price: "A partir de R$ 349/mês",
            color_scheme: "from-purple-500 to-purple-600",
            is_active: true,
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        return fallbackCourses.find((course) => course.slug === slug) || null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting course by slug:", error);
    return null;
  }
}

// Submit a prospect (lead capture)
export async function submitProspect(
  prospectData: Omit<Prospect, "id" | "created_at" | "updated_at">
) {
  try {
    prospectsLoading.set(true);
    prospectsError.set(null);

    const { data, error } = await supabase
      .from("prospects")
      .insert([prospectData])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, simulate success for development
      if (error.code === "42P01") {
        // Table doesn't exist
        console.warn(
          "prospects table not found, simulating success for development"
        );
        const simulatedProspect = {
          id: Math.random().toString(36).substr(2, 9),
          ...prospectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Prospect;

        // Add to local store
        prospects.update((current) => [...current, simulatedProspect]);

        return { success: true, data: simulatedProspect };
      }
      throw error;
    }

    // Add to local store
    prospects.update((current) => [...current, data]);

    return { success: true, data };
  } catch (error) {
    console.error("Error submitting prospect:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit prospect";
    prospectsError.set(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    prospectsLoading.set(false);
  }
}

// Load prospects (admin only)
export async function loadProspects() {
  try {
    prospectsLoading.set(true);
    prospectsError.set(null);

    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    prospects.set(data || []);
  } catch (error) {
    console.error("Error loading prospects:", error);
    prospectsError.set(
      error instanceof Error ? error.message : "Failed to load prospects"
    );
  } finally {
    prospectsLoading.set(false);
  }
}

// Update prospect status (admin only)
export async function updateProspectStatus(prospectId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from("prospects")
      .update({ status })
      .eq("id", prospectId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update local store
    prospects.update((current) =>
      current.map((p) => (p.id === prospectId ? { ...p, status } : p))
    );

    return { success: true, data };
  } catch (error) {
    console.error("Error updating prospect status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update prospect",
    };
  }
}

// Initialize vitrine data
export async function initializeVitrine() {
  console.log("=== initializeVitrine called ===");
  try {
    console.log("About to call loadPublicCourses and loadAllCourseMaterials");
    await Promise.all([loadPublicCourses(), loadAllCourseMaterials()]);
    console.log("Vitrine initialization complete");
  } catch (error) {
    console.error("Error initializing vitrine:", error);
  }
}
