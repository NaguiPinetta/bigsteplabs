import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Content } from "$lib/types/database";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  canLoadData,
} from "./data-manager";

interface ContentState {
  content: Content[];
  loading: boolean;
  error: string | null;
  selectedContent: Content | null;
}

const initialState: ContentState = {
  content: [],
  loading: false,
  error: null,
  selectedContent: null,
};

export const contentStore = writable<ContentState>(initialState);

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Load all content from Supabase
 */
export async function loadContent(unitId?: string, forceRefresh = false) {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    console.log(
      "⏸️ Skipping content load - auth not ready or user cannot manage"
    );
    return { data: null, error: "Not authorized or auth not ready" };
  }

  // Check if data is already loading
  const currentState = get(contentStore);
  if (currentState.loading) {
    console.log("⏸️ Content already loading, skipping...");
    return { data: currentState.content, error: null };
  }

  // Check if we need to refresh data
  if (
    !forceRefresh &&
    !shouldRefreshData("content") &&
    currentState.content.length > 0
  ) {
    console.log("⏸️ Content data is fresh, skipping load...");
    return { data: currentState.content, error: null };
  }

  console.log("🔍 Loading content from Supabase...");
  setLoadingState("content", true);
  contentStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    let query = supabase
      .from("content")
      .select("*")
      .order("order_index", { ascending: true });

    if (unitId) {
      query = query.eq("unit_id", unitId);
    }

    const { data: content, error } = await query;

    if (error) {
      console.error("❌ Error loading content:", error);
      contentStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      setDataError("content", error.message);
      return { data: null, error };
    }

    console.log(
      "✅ Content loaded successfully:",
      content?.length || 0,
      "items"
    );
    contentStore.update((state) => ({
      ...state,
      content: content || [],
      loading: false,
    }));

    setDataLoaded("content");
    return { data: content, error: null };
  } catch (error) {
    console.error("❌ Unexpected error loading content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load content";
    contentStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    setDataError("content", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Create new content in Supabase
 */
export async function createContent(
  content: Omit<
    Content,
    "id" | "created_at" | "updated_at" | "order_index" | "slug"
  >
) {
  contentStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    // Get the next order index for this unit
    const { data: currentContent, error: countError } = await supabase
      .from("content")
      .select("order_index")
      .eq("unit_id", content.unit_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex =
      currentContent && currentContent.length > 0
        ? (currentContent[0].order_index || 0) + 1
        : 1;

    const { data: newContent, error } = await supabase
      .from("content")
      .insert({
        title: content.title,
        description: content.description,
        content: content.content,
        type: content.type,
        file_url: content.file_url,
        unit_id: content.unit_id,
        order_index: nextOrderIndex,
        is_published: content.is_published,
        metadata: content.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating content:", error);
      contentStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    console.log("✅ Content created successfully:", newContent.title);
    contentStore.update((state) => ({
      ...state,
      content: [...state.content, newContent],
      loading: false,
    }));

    return { data: newContent, error: null };
  } catch (error) {
    console.error("❌ Unexpected error creating content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create content";
    contentStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update content in Supabase
 */
export async function updateContent(id: string, updates: Partial<Content>) {
  contentStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data: updatedContent, error } = await supabase
      .from("content")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating content:", error);
      contentStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    console.log("✅ Content updated successfully:", updatedContent.title);
    contentStore.update((state) => ({
      ...state,
      content: state.content.map((c) => (c.id === id ? updatedContent : c)),
      loading: false,
    }));

    return { data: updatedContent, error: null };
  } catch (error) {
    console.error("❌ Unexpected error updating content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update content";
    contentStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete content from Supabase
 */
export async function deleteContent(id: string) {
  contentStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { error } = await supabase.from("content").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting content:", error);
      contentStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { success: false, error };
    }

    console.log("✅ Content deleted successfully:", id);
    contentStore.update((state) => ({
      ...state,
      content: state.content.filter((c) => c.id !== id),
      loading: false,
    }));

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Unexpected error deleting content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete content";
    contentStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Set selected content
 */
export function setSelectedContent(content: Content | null) {
  contentStore.update((state) => ({ ...state, selectedContent: content }));
}

/**
 * Clear content error
 */
export function clearContentError() {
  contentStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate content data
 */
export function validateContent(content: Partial<Content>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content.title || content.title.trim().length < 3) {
    errors.push("Content title must be at least 3 characters long");
  }

  if (content.title && content.title.length > 200) {
    errors.push("Content title must be less than 200 characters");
  }

  if (content.description && content.description.length > 1000) {
    errors.push("Content description must be less than 1000 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
