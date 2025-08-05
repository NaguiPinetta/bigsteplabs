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
    return;
  }

  setLoadingState(dataType, true);
  lessonsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, title),
        unit:units(id, title),
        agent:agents(id, name, description, is_active)
      `
      )
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setDataError(dataType, error.message);
      lessonsStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return;
    }

    
    setDataLoaded(dataType);

    lessonsStore.update((state) => ({
      ...state,
      lessons: data || [],
      loading: false,
      error: null,
    }));
  } catch (error) {
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
  agent_id?: string | null;
  content_type?: string;
  order_index?: number;
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
    agent_id?: string | null;
    content_type?: string;
    order_index?: number;
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

    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      throw error;
    }

    

    // Update the store
    lessonsStore.update((state) => ({
      ...state,
      lessons: state.lessons.filter((lesson) => lesson.id !== id),
    }));

    return true;
  } catch (error) {
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
      return null;
    }

    
    return data;
  } catch (error) {
    return null;
  }
}

export async function getLessonsByModule(
  moduleId: string
): Promise<LessonWithRelations[]> {
  try {

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
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getLessonsByUnit(
  unitId: string
): Promise<LessonWithRelations[]> {
  try {

    const { data, error } = await supabase
      .from("lessons")
      .select(
        `
        *,
        module:modules(id, title),
        unit:units(id, title),
        agent:agents(id, name, description, is_active)
      `
      )
      .eq("unit_id", unitId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function reorderLessons(lessonIds: string[]): Promise<boolean> {
  try {

    const response = await fetch("/api/reorder-lessons-manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lessonIds }),
    });

    const result = await response.json();

    if (!result.success) {
      return false;
    }

    
    return true;
  } catch (error) {
    return false;
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
