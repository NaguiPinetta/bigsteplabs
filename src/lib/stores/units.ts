import { writable } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data
import type { Unit } from "$lib/types/database";

interface UnitsState {
  units: Unit[];
  loading: boolean;
  error: string | null;
  selectedUnit: Unit | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialUnits(): Unit[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_units");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored units:", e);
      }
    }
  }

  // Only return mock data if no existing data
  return [
    {
      id: "mock-unit-1",
      module_id: "mock-module-1",
      title: "Basic Greetings",
      description: "Learn common Spanish greetings and introductions",
      slug: "basic-greetings",
      status: "pending",
      order_index: 1,
      estimated_duration_minutes: 30,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

const initialUnits = getInitialUnits();

const initialState: UnitsState = {
  units: initialUnits,
  loading: false,
  error: null,
  selectedUnit: null,
};

export const unitsStore = writable<UnitsState>(initialState);

// Save units to localStorage whenever they change
function saveUnitsToStorage(units: Unit[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_units", JSON.stringify(units));
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
 * Load all units, optionally filtered by module
 */
export async function loadUnits(moduleId?: string) {
  unitsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const currentUnits = getInitialUnits();
    const filteredUnits = moduleId
      ? currentUnits.filter((unit) => unit.module_id === moduleId)
      : currentUnits;

    unitsStore.update((state) => ({
      ...state,
      units: filteredUnits.sort((a, b) => a.order_index - b.order_index),
      loading: false,
    }));

    return { data: filteredUnits, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load units";
    unitsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new unit (mock implementation)
 */
export async function createUnit(
  unit: Omit<Unit, "id" | "created_at" | "updated_at" | "order_index" | "slug">
) {
  unitsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const currentUnits = getInitialUnits();

    // Calculate next order index for this module
    const moduleUnits = currentUnits.filter(
      (u) => u.module_id === unit.module_id
    );
    const nextOrder =
      moduleUnits.length > 0
        ? Math.max(...moduleUnits.map((u) => u.order_index)) + 1
        : 1;

    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      module_id: unit.module_id,
      title: unit.title,
      description: unit.description,
      slug: generateSlug(unit.title),
      status: unit.status || "pending",
      order_index: nextOrder,
      estimated_duration_minutes: unit.estimated_duration_minutes || 30,
      is_published: unit.is_published || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to current units
    const updatedUnits = [...currentUnits, newUnit].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveUnitsToStorage(updatedUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: updatedUnits,
      loading: false,
    }));

    console.log("✅ Unit created successfully:", newUnit.title);
    return { data: newUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create unit";
    unitsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a unit (mock implementation)
 */
export async function updateUnit(id: string, updates: Partial<Unit>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentUnits = getInitialUnits();
    const unitIndex = currentUnits.findIndex((u) => u.id === id);
    if (unitIndex === -1) {
      throw new Error("Unit not found");
    }

    // Update the unit
    const updatedUnit = {
      ...currentUnits[unitIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentUnits[unitIndex] = updatedUnit;
    const sortedUnits = [...currentUnits].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveUnitsToStorage(sortedUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: sortedUnits,
    }));

    console.log("✅ Unit updated successfully:", updatedUnit.title);
    return { data: updatedUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update unit";
    unitsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a unit (mock implementation)
 */
export async function deleteUnit(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentUnits = getInitialUnits();
    const unitIndex = currentUnits.findIndex((u) => u.id === id);
    if (unitIndex === -1) {
      throw new Error("Unit not found");
    }

    const deletedUnit = currentUnits[unitIndex];
    currentUnits.splice(unitIndex, 1);
    saveUnitsToStorage(currentUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: [...currentUnits],
    }));

    console.log("✅ Unit deleted successfully:", deletedUnit.title);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete unit";
    unitsStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Reorder units within a module (mock implementation)
 */
export async function reorderUnits(unitIds: string[]) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentUnits = getInitialUnits();

    // Update order indexes based on new order
    unitIds.forEach((id, index) => {
      const unit = currentUnits.find((u) => u.id === id);
      if (unit) {
        unit.order_index = index + 1;
        unit.updated_at = new Date().toISOString();
      }
    });

    const sortedUnits = [...currentUnits].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveUnitsToStorage(sortedUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: sortedUnits,
    }));

    console.log("✅ Units reordered successfully");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reorder units";
    unitsStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Toggle unit publication status (mock implementation)
 */
export async function toggleUnitPublication(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentUnits = getInitialUnits();
    const unit = currentUnits.find((u) => u.id === id);
    if (!unit) {
      throw new Error("Unit not found");
    }

    unit.is_published = !unit.is_published;
    unit.updated_at = new Date().toISOString();
    saveUnitsToStorage(currentUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: [...currentUnits],
    }));

    console.log("✅ Unit publication toggled:", unit.title, unit.is_published);
    return { data: unit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle publication";
    unitsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Set selected unit
 */
export function setSelectedUnit(unit: Unit | null) {
  unitsStore.update((state) => ({ ...state, selectedUnit: unit }));
}

/**
 * Clear units error
 */
export function clearUnitsError() {
  unitsStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate unit data
 */
export function validateUnit(unit: Partial<Unit>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!unit.title || unit.title.trim().length < 3) {
    errors.push("Unit title must be at least 3 characters long");
  }

  if (unit.title && unit.title.length > 100) {
    errors.push("Unit title must be less than 100 characters");
  }

  if (!unit.module_id) {
    errors.push("Unit must be associated with a module");
  }

  if (unit.description && unit.description.length > 500) {
    errors.push("Unit description must be less than 500 characters");
  }

  if (
    unit.estimated_duration_minutes &&
    (unit.estimated_duration_minutes < 1 ||
      unit.estimated_duration_minutes > 1440)
  ) {
    errors.push("Estimated duration must be between 1 and 1440 minutes");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get unit statistics (mock implementation)
 */
export async function getUnitStats(unitId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Return mock statistics
  return {
    content: Math.floor(Math.random() * 10) + 1,
    completions: Math.floor(Math.random() * 50) + 5,
    avgRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
  };
}

/**
 * Duplicate a unit (mock implementation)
 */
export async function duplicateUnit(unitId: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentUnits = getInitialUnits();
    const originalUnit = currentUnits.find((u) => u.id === unitId);
    if (!originalUnit) {
      throw new Error("Unit not found");
    }

    // Calculate next order index for this module
    const moduleUnits = currentUnits.filter(
      (u) => u.module_id === originalUnit.module_id
    );
    const nextOrder = Math.max(...moduleUnits.map((u) => u.order_index)) + 1;

    const duplicatedUnit: Unit = {
      ...originalUnit,
      id: `unit-${Date.now()}`,
      title: `${originalUnit.title} (Copy)`,
      slug: generateSlug(`${originalUnit.title} (Copy)`),
      order_index: nextOrder,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedUnits = [...currentUnits, duplicatedUnit].sort(
      (a, b) => a.order_index - b.order_index
    );
    saveUnitsToStorage(updatedUnits);

    // Update store
    unitsStore.update((state) => ({
      ...state,
      units: updatedUnits,
    }));

    console.log("✅ Unit duplicated successfully:", duplicatedUnit.title);
    return { data: duplicatedUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to duplicate unit";
    unitsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Get units by module ID (helper function)
 */
export function getUnitsByModule(moduleId: string): Unit[] {
  const currentUnits = getInitialUnits();
  return currentUnits
    .filter((unit) => unit.module_id === moduleId)
    .sort((a, b) => a.order_index - b.order_index);
}
