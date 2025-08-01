import { writable, derived } from "svelte/store";
import { supabase } from "$lib/supabase";
import type {
  Module,
  ModuleInsert,
  ModuleUpdate,
  ModuleWithRelations,
} from "$lib/types/database";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  getLoadingState,
  getCachedData,
  safeDataLoad,
} from "$lib/stores/data-manager";

interface ModulesState {
  modules: ModuleWithRelations[];
  selectedModule: ModuleWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: ModulesState = {
  modules: [],
  selectedModule: null,
  loading: false,
  error: null,
};

export const modulesStore = writable<ModulesState>(initialState);

// Derived stores
export const isModulesLoading = derived(
  modulesStore,
  ($modulesStore) => $modulesStore.loading
);
export const modulesError = derived(
  modulesStore,
  ($modulesStore) => $modulesStore.error
);

export async function loadModules(forceRefresh = false): Promise<void> {
  const dataType = "modules";

  try {
    // Use the enhanced safe data loading function
    const data = await safeDataLoad(
      dataType,
      async () => {
        console.log("🔄 Loading modules from database...");

        const { data, error } = await supabase
          .from("modules")
          .select(
            `
            *,
            units:units(
              id,
              title,
              description,
              order_index,
              module_id,
              lessons:lessons(
                id,
                title,
                notion_url,
                embed_url,
                order_index,
                unit_id,
                agent:agents(id, name, description, is_active)
              )
            )
          `
          )
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error loading modules:", error);
          throw new Error(error.message);
        }

        console.log("✅ Loaded", data?.length || 0, "modules from database");
        return data || [];
      },
      forceRefresh
    );

    // Update the store with the loaded data
    modulesStore.update((state) => ({
      ...state,
      modules: data,
      loading: false,
      error: null,
    }));
  } catch (error) {
    console.error("❌ Error in loadModules:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load modules";

    modulesStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
  }
}

export async function createModule(moduleData: {
  title: string;
  description?: string;
  order_index?: number;
  is_published?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from("modules")
      .insert([moduleData])
      .select()
      .single();

    if (error) throw error;

    // Update the store
    modulesStore.update((state) => ({
      ...state,
      modules: [...state.modules, data],
      loading: false,
    }));

    // Force refresh cache
    setDataLoaded("modules", [...(getCachedData("modules") || []), data]);

    return data;
  } catch (error) {
    console.error("Error creating module:", error);
    modulesStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to create module",
      loading: false,
    }));
    return null;
  }
}

export async function updateModule(
  id: string,
  moduleData: {
    title?: string;
    description?: string;
    order_index?: number;
    is_published?: boolean;
  }
) {
  try {
    const { data, error } = await supabase
      .from("modules")
      .update(moduleData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update the store
    modulesStore.update((state) => ({
      ...state,
      modules: state.modules.map((module) =>
        module.id === id ? data : module
      ),
      loading: false,
    }));

    // Update cache
    const cachedData = getCachedData("modules") || [];
    const updatedCache = cachedData.map((module: any) =>
      module.id === id ? data : module
    );
    setDataLoaded("modules", updatedCache);

    return data;
  } catch (error) {
    console.error("Error updating module:", error);
    modulesStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to update module",
      loading: false,
    }));
    return null;
  }
}

export async function deleteModule(id: string): Promise<boolean> {
  try {
    console.log("🔍 Deleting module:", id);

    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting module:", error);
      throw error;
    }

    console.log("✅ Module deleted successfully");

    // Update the store
    modulesStore.update((state) => ({
      ...state,
      modules: state.modules.filter((module) => module.id !== id),
    }));

    // Update cache
    const cachedData = getCachedData("modules") || [];
    const updatedCache = cachedData.filter((module: any) => module.id !== id);
    setDataLoaded("modules", updatedCache);

    return true;
  } catch (error) {
    console.error("❌ Error deleting module:", error);
    modulesStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to delete module",
    }));
    return false;
  }
}

export async function reorderModules(moduleIds: string[]): Promise<boolean> {
  try {
    console.log("🔄 Reordering modules:", moduleIds);

    const response = await fetch("/api/reorder-modules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moduleIds }),
    });

    const result = await response.json();

    if (!result.success) {
      console.error("❌ Error reordering modules:", result.error);
      return false;
    }

    console.log("✅ Modules reordered successfully");

    // Force refresh to get updated order
    await loadModules(true);

    return true;
  } catch (error) {
    console.error("❌ Error reordering modules:", error);
    return false;
  }
}

export async function getModuleById(
  id: string
): Promise<ModuleWithRelations | null> {
  try {
    console.log("🔍 Getting module by ID:", id);

    const { data, error } = await supabase
      .from("modules")
      .select(
        `
        *,
        units:units(
          id,
          title,
          description,
          order_index,
          module_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error getting module:", error);
      return null;
    }

    console.log("✅ Retrieved module:", data);
    return data;
  } catch (error) {
    console.error("❌ Error getting module:", error);
    return null;
  }
}

// Helper functions
export function clearError(): void {
  modulesStore.update((state) => ({ ...state, error: null }));
}

export function setSelectedModule(module: ModuleWithRelations | null): void {
  modulesStore.update((state) => ({ ...state, selectedModule: module }));
}

export function clearSelectedModule(): void {
  modulesStore.update((state) => ({ ...state, selectedModule: null }));
}

/**
 * Clear localStorage and reset modules store
 */
export function clearModulesCache(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("bigstep_modules_cache");
  }
  modulesStore.set(initialState);
}
