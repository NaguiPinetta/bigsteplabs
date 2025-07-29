import { writable, derived } from "svelte/store";
import { supabase } from "$lib/supabase";
import type {
  Lesson,
  LessonInsert,
  LessonUpdate,
  LessonWithRelations,
} from "$lib/types/database";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  getLoadingState,
} from "$lib/stores/data-manager";

interface LessonsState {
  lessons: LessonWithRelations[];
  selectedLesson: LessonWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: LessonsState = {
  lessons: [],
  selectedLesson: null,
  loading: false,
  error: null,
};

export const lessonsStore = writable<LessonsState>(initialState);

// Derived stores
export const isLessonsLoading = derived(
  lessonsStore,
  ($lessonsStore) => $lessonsStore.loading
);
export const lessonsError = derived(
  lessonsStore,
  ($lessonsStore) => $lessonsStore.error
);

export async function loadLessons(forceRefresh = false): Promise<void> {
  const dataType = "lessons";

  if (!forceRefresh && !shouldRefreshData(dataType)) {
    console.log("🔄 Skipping lessons load - data is fresh");
    return;
  }

  setLoadingState(dataType, true);
  lessonsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    console.log("🔄 Loading lessons...");

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, title),
        unit:units(id, title)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error loading lessons:", error);
      setDataError(dataType, error.message);
      lessonsStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return;
    }

    console.log("✅ Loaded", data?.length || 0, "lessons");
    setDataLoaded(dataType);

    lessonsStore.update((state) => ({
      ...state,
      lessons: data || [],
      loading: false,
      error: null,
    }));
  } catch (error) {
    console.error("❌ Error loading lessons:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load lessons";
    setDataError(dataType, errorMessage);
    lessonsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
  }
}

export async function createLesson(lessonData: {
  title: string;
  notion_url: string;
  embed_url?: string | null;
  module_id?: string | null;
  unit_id?: string | null;
  content_type?: any;
  is_published?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from("lessons")
      .insert([lessonData])
      .select()
      .single();

    if (error) throw error;

    // Update the store
    lessonsStore.update((state) => ({
      ...state,
      lessons: [...state.lessons, data],
      loading: false,
    }));

    return data;
  } catch (error) {
    console.error("Error creating lesson:", error);
    lessonsStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to create lesson",
      loading: false,
    }));
    return null;
  }
}

export async function updateLesson(
  id: string,
  lessonData: {
    title?: string;
    notion_url?: string;
    embed_url?: string | null;
    module_id?: string | null;
    unit_id?: string | null;
    content_type?: any;
    is_published?: boolean;
  }
) {
  try {
    const { data, error } = await supabase
      .from("lessons")
      .update(lessonData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update the store
    lessonsStore.update((state) => ({
      ...state,
      lessons: state.lessons.map((lesson) =>
        lesson.id === id ? data : lesson
      ),
      loading: false,
    }));

    return data;
  } catch (error) {
    console.error("Error updating lesson:", error);
    lessonsStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to update lesson",
      loading: false,
    }));
    return null;
  }
}

export async function deleteLesson(id: string): Promise<boolean> {
  try {
    console.log("🔍 Deleting lesson:", id);

    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting lesson:", error);
      throw error;
    }

    console.log("✅ Lesson deleted successfully");

    // Update the store
    lessonsStore.update((state) => ({
      ...state,
      lessons: state.lessons.filter((lesson) => lesson.id !== id),
    }));

    return true;
  } catch (error) {
    console.error("❌ Error deleting lesson:", error);
    lessonsStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to delete lesson",
    }));
    return false;
  }
}

export async function getLessonById(
  id: string
): Promise<LessonWithRelations | null> {
  try {
    console.log("🔍 Getting lesson by ID:", id);

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, title),
        unit:units(id, title)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error getting lesson:", error);
      return null;
    }

    console.log("✅ Retrieved lesson:", data);
    return data;
  } catch (error) {
    console.error("❌ Error getting lesson:", error);
    return null;
  }
}

export async function getLessonsByModule(
  moduleId: string
): Promise<LessonWithRelations[]> {
  try {
    console.log("🔍 Getting lessons by module:", moduleId);

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, name),
        unit:units(id, name)
      `
      )
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error getting lessons by module:", error);
      return [];
    }

    console.log("✅ Retrieved", data?.length || 0, "lessons for module");
    return data || [];
  } catch (error) {
    console.error("❌ Error getting lessons by module:", error);
    return [];
  }
}

export async function getLessonsByUnit(
  unitId: string
): Promise<LessonWithRelations[]> {
  try {
    console.log("🔍 Getting lessons by unit:", unitId);

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, name),
        unit:units(id, name)
      `
      )
      .eq("unit_id", unitId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error getting lessons by unit:", error);
      return [];
    }

    console.log("✅ Retrieved", data?.length || 0, "lessons for unit");
    return data || [];
  } catch (error) {
    console.error("❌ Error getting lessons by unit:", error);
    return [];
  }
}

// Helper functions
export function clearError(): void {
  lessonsStore.update((state) => ({ ...state, error: null }));
}

export function setSelectedLesson(lesson: LessonWithRelations | null): void {
  lessonsStore.update((state) => ({ ...state, selectedLesson: lesson }));
}

export function clearSelectedLesson(): void {
  lessonsStore.update((state) => ({ ...state, selectedLesson: null }));
}
