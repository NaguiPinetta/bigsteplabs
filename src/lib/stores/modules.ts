import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Module } from "$lib/types/database";

interface ModulesState {
  modules: Module[];
  loading: boolean;
  error: string | null;
  selectedModule: Module | null;
}

const initialState: ModulesState = {
  modules: [],
  loading: false,
  error: null,
  selectedModule: null,
};

export const modulesStore = writable<ModulesState>(initialState);

/**
 * Load all modules from Supabase
 */
export async function loadModules() {
  console.log("🔍 Loading modules from Supabase...");
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data: modules, error } = await supabase
      .from("modules")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("❌ Error loading modules:", error);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    console.log(
      "✅ Modules loaded successfully:",
      modules?.length || 0,
      "modules"
    );
    modulesStore.update((state) => ({
      ...state,
      modules: modules || [],
      loading: false,
    }));

    return { data: modules, error: null };
  } catch (error) {
    console.error("❌ Unexpected error loading modules:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load modules";
    modulesStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

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
 * Create a new module in Supabase
 */
export async function createModule(
  module: Omit<
    Module,
    "id" | "created_at" | "updated_at" | "slug" | "order_index"
  >
) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data: newModule, error } = await supabase
      .from("modules")
      .insert({
        title: module.title,
        description: module.description,
        slug: generateSlug(module.title),
        is_published: module.is_published,
        order_index: 0, // Order index will be set after loading
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating module:", error);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    console.log("✅ Module created successfully:", newModule.title);
    modulesStore.update((state) => ({
      ...state,
      modules: [...state.modules, newModule],
      loading: false,
    }));

    return { data: newModule, error: null };
  } catch (error) {
    console.error("❌ Unexpected error creating module:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create module";
    modulesStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a module in Supabase
 */
export async function updateModule(id: string, updates: Partial<Module>) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data: updatedModule, error } = await supabase
      .from("modules")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        slug: updates.title ? generateSlug(updates.title) : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating module:", error);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    console.log("✅ Module updated successfully:", updatedModule.title);
    modulesStore.update((state) => ({
      ...state,
      modules: state.modules.map((m) => (m.id === id ? updatedModule : m)),
      loading: false,
    }));

    return { data: updatedModule, error: null };
  } catch (error) {
    console.error("❌ Unexpected error updating module:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update module";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a module from Supabase
 */
export async function deleteModule(id: string) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting module:", error);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { success: false, error };
    }

    console.log("✅ Module deleted successfully:", id);
    modulesStore.update((state) => ({
      ...state,
      modules: state.modules.filter((m) => m.id !== id),
      loading: false,
    }));

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Unexpected error deleting module:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete module";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Reorder modules in Supabase
 */
export async function reorderModules(moduleIds: string[]) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const updatedModules = await Promise.all(
      moduleIds.map(async (id, index) => {
        const { data: module, error } = await supabase
          .from("modules")
          .update({
            order_index: index + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("❌ Error reordering module:", error);
          throw new Error(`Failed to reorder module ${id}: ${error.message}`);
        }
        return module;
      })
    );

    console.log("✅ Modules reordered successfully");
    modulesStore.update((state) => ({
      ...state,
      modules: updatedModules,
      loading: false,
    }));

    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Unexpected error reordering modules:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reorder modules";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Toggle module publication status in Supabase
 */
export async function toggleModulePublication(id: string) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data: module, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error toggling module publication:", error);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    if (!module) {
      console.error("❌ Module not found for publication toggle:", id);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: "Module not found",
      }));
      return { data: null, error: "Module not found" };
    }

    const updatedModule = {
      ...module,
      is_published: !module.is_published,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("modules")
      .update(updatedModule)
      .eq("id", id);

    if (updateError) {
      console.error("❌ Error updating module publication:", updateError);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: updateError.message,
      }));
      return { data: null, error: updateError.message };
    }

    console.log(
      "✅ Module publication toggled:",
      updatedModule.title,
      updatedModule.is_published
    );
    modulesStore.update((state) => ({
      ...state,
      modules: state.modules.map((m) => (m.id === id ? updatedModule : m)),
      loading: false,
    }));

    return { data: updatedModule, error: null };
  } catch (error) {
    console.error("❌ Unexpected error toggling module publication:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle publication";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Set selected module
 */
export function setSelectedModule(module: Module | null) {
  modulesStore.update((state) => ({ ...state, selectedModule: module }));
}

/**
 * Clear modules error
 */
export function clearModulesError() {
  modulesStore.update((state) => ({ ...state, error: null }));
}

/**
 * Clear localStorage and reset modules store
 */
export function clearModulesStorage() {
  // This function is no longer needed as modules are stored in Supabase
  // Keeping it for now, but it will not clear Supabase data.
  console.log(
    "⚠️ clearModulesStorage is deprecated. Supabase data is not cleared."
  );
  modulesStore.update((state) => ({
    ...state,
    modules: [], // Clear in-memory modules
    loading: false,
    error: null,
  }));
}

/**
 * Validate module data
 */
export function validateModule(module: Partial<Module>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!module.title || module.title.trim().length < 3) {
    errors.push("Module title must be at least 3 characters long");
  }

  if (module.title && module.title.length > 100) {
    errors.push("Module title must be less than 100 characters");
  }

  if (module.description && module.description.length > 500) {
    errors.push("Module description must be less than 500 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get module statistics from Supabase
 */
export async function getModuleStats(moduleId: string) {
  try {
    // Get units count for this module
    const { count: unitsCount, error: unitsError } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId);

    if (unitsError) {
      console.error("❌ Error getting units count:", unitsError);
      return { units: 0, content: 0, students: 0 };
    }

    // Get content count for this module (via units)
    const { data: unitIds, error: unitIdsError } = await supabase
      .from("units")
      .select("id")
      .eq("module_id", moduleId);

    let contentCount = 0;
    if (!unitIdsError && unitIds && unitIds.length > 0) {
      const unitIdArray = unitIds.map((u) => u.id);
      const { count: contentCountResult, error: contentError } = await supabase
        .from("content")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIdArray);

      if (!contentError) {
        contentCount = contentCountResult || 0;
      } else {
        console.error("❌ Error getting content count:", contentError);
      }
    }

    // Mock students count for now (would need user_progress table)
    const studentsCount = Math.floor(Math.random() * 100) + 10;

    return {
      units: unitsCount || 0,
      content: contentCount || 0,
      students: studentsCount,
    };
  } catch (error) {
    console.error("❌ Error getting module stats:", error);
    return { units: 0, content: 0, students: 0 };
  }
}

/**
 * Duplicate a module in Supabase
 */
export async function duplicateModule(moduleId: string) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    // Get the original module
    const { data: originalModule, error: fetchError } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (fetchError || !originalModule) {
      console.error("❌ Error fetching original module:", fetchError);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: fetchError?.message || "Module not found",
      }));
      return { data: null, error: fetchError?.message || "Module not found" };
    }

    // Create the duplicated module
    const { data: duplicatedModule, error: createError } = await supabase
      .from("modules")
      .insert({
        title: `${originalModule.title} (Copy)`,
        description: originalModule.description,
        slug: generateSlug(`${originalModule.title} (Copy)`),
        is_published: false,
        order_index: 0, // Will be set after loading
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating duplicated module:", createError);
      modulesStore.update((state) => ({
        ...state,
        loading: false,
        error: createError.message,
      }));
      return { data: null, error: createError.message };
    }

    console.log("✅ Module duplicated successfully:", duplicatedModule.title);
    modulesStore.update((state) => ({
      ...state,
      modules: [...state.modules, duplicatedModule],
      loading: false,
    }));

    return { data: duplicatedModule, error: null };
  } catch (error) {
    console.error("❌ Unexpected error duplicating module:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to duplicate module";
    modulesStore.update((state) => ({
      ...state,
      error: errorMessage,
      loading: false,
    }));
    return { data: null, error: errorMessage };
  }
}
