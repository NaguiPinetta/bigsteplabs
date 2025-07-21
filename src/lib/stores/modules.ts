import { writable } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data
import type { Module } from "$lib/types/database";

interface ModulesState {
  modules: Module[];
  loading: boolean;
  error: string | null;
  selectedModule: Module | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialModules(): Module[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_modules");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored modules:", e);
      }
    }
  }

  // Only return mock data if no existing data
  return [
    {
      id: "mock-module-1",
      title: "Introduction to Spanish",
      description: "Basic Spanish vocabulary and grammar foundations",
      slug: "introduction-to-spanish",
      is_published: true,
      order_index: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

const initialModules = getInitialModules();

const initialState: ModulesState = {
  modules: initialModules,
  loading: false,
  error: null,
  selectedModule: null,
};

export const modulesStore = writable<ModulesState>(initialState);

// Save modules to localStorage whenever they change
function saveModulesToStorage(modules: Module[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_modules", JSON.stringify(modules));
  }
}

/**
 * Load all modules (mock implementation)
 */
export async function loadModules() {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const currentModules = getInitialModules();

    modulesStore.update((state) => ({
      ...state,
      modules: currentModules,
      loading: false,
    }));

    return { data: currentModules, error: null };
  } catch (error) {
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
 * Create a new module (mock implementation)
 */
export async function createModule(
  module: Omit<
    Module,
    "id" | "created_at" | "updated_at" | "slug" | "order_index"
  >
) {
  modulesStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const currentModules = getInitialModules();

    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: module.title,
      description: module.description,
      slug: generateSlug(module.title),
      is_published: module.is_published,
      order_index: currentModules.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to current modules
    const updatedModules = [...currentModules, newModule].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveModulesToStorage(updatedModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: updatedModules,
      loading: false,
    }));

    console.log("✅ Module created successfully:", newModule.title);
    return { data: newModule, error: null };
  } catch (error) {
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
 * Update a module (mock implementation)
 */
export async function updateModule(id: string, updates: Partial<Module>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModules = getInitialModules();
    const moduleIndex = currentModules.findIndex((m) => m.id === id);
    if (moduleIndex === -1) {
      throw new Error("Module not found");
    }

    // Update the module
    const updatedModule = {
      ...currentModules[moduleIndex],
      ...updates,
      updated_at: new Date().toISOString(),
      slug: updates.title
        ? generateSlug(updates.title)
        : currentModules[moduleIndex].slug,
    };

    currentModules[moduleIndex] = updatedModule;
    const sortedModules = [...currentModules].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveModulesToStorage(sortedModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: sortedModules,
    }));

    console.log("✅ Module updated successfully:", updatedModule.title);
    return { data: updatedModule, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update module";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a module (mock implementation)
 */
export async function deleteModule(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModules = getInitialModules();
    const moduleIndex = currentModules.findIndex((m) => m.id === id);
    if (moduleIndex === -1) {
      throw new Error("Module not found");
    }

    const deletedModule = currentModules[moduleIndex];
    currentModules.splice(moduleIndex, 1);
    saveModulesToStorage(currentModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: [...currentModules],
    }));

    console.log("✅ Module deleted successfully:", deletedModule.title);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete module";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Reorder modules (mock implementation)
 */
export async function reorderModules(moduleIds: string[]) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModules = getInitialModules();

    // Update order indexes based on new order
    moduleIds.forEach((id, index) => {
      const module = currentModules.find((m) => m.id === id);
      if (module) {
        module.order_index = index + 1;
        module.updated_at = new Date().toISOString();
      }
    });

    const sortedModules = [...currentModules].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveModulesToStorage(sortedModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: sortedModules,
    }));

    console.log("✅ Modules reordered successfully");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reorder modules";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Toggle module publication status (mock implementation)
 */
export async function toggleModulePublication(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModules = getInitialModules();
    const module = currentModules.find((m) => m.id === id);
    if (!module) {
      throw new Error("Module not found");
    }

    module.is_published = !module.is_published;
    module.updated_at = new Date().toISOString();
    saveModulesToStorage(currentModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: [...currentModules],
    }));

    console.log(
      "✅ Module publication toggled:",
      module.title,
      module.is_published
    );
    return { data: module, error: null };
  } catch (error) {
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
 * Get module statistics (mock implementation)
 */
export async function getModuleStats(moduleId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Return mock statistics
  return {
    units: Math.floor(Math.random() * 10) + 1,
    content: Math.floor(Math.random() * 20) + 5,
    students: Math.floor(Math.random() * 100) + 10,
  };
}

/**
 * Duplicate a module (mock implementation)
 */
export async function duplicateModule(moduleId: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentModules = getInitialModules();
    const originalModule = currentModules.find((m) => m.id === moduleId);
    if (!originalModule) {
      throw new Error("Module not found");
    }

    const duplicatedModule: Module = {
      ...originalModule,
      id: `module-${Date.now()}`,
      title: `${originalModule.title} (Copy)`,
      slug: generateSlug(`${originalModule.title} (Copy)`),
      is_published: false,
      order_index: currentModules.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedModules = [...currentModules, duplicatedModule].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveModulesToStorage(updatedModules);

    // Update store
    modulesStore.update((state) => ({
      ...state,
      modules: updatedModules,
    }));

    console.log("✅ Module duplicated successfully:", duplicatedModule.title);
    return { data: duplicatedModule, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to duplicate module";
    modulesStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}
