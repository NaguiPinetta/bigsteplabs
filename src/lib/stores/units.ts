import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Unit } from "$lib/types/database";
import { 
  setLoadingState, 
  setDataError, 
  setDataLoaded, 
  shouldRefreshData,
  canLoadData 
} from "./data-manager";

interface UnitsState {
  units: Unit[];
  loading: boolean;
  error: string | null;
  selectedUnit: Unit | null;
}

const initialState: UnitsState = {
  units: [],
  loading: false,
  error: null,
  selectedUnit: null,
};

export const unitsStore = writable<UnitsState>(initialState);

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
export async function loadUnits(moduleId?: string, forceRefresh = false) {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    
    return { data: null, error: "Not authorized or auth not ready" };
  }

  // Check if data is already loading
  const currentState = get(unitsStore);
  if (currentState.loading) {
    
    return { data: currentState.units, error: null };
  }

  // Check if we need to refresh data (only for non-filtered loads)
  if (!moduleId && !forceRefresh && !shouldRefreshData("units") && currentState.units.length > 0) {
    
    return { data: currentState.units, error: null };
  }

  setLoadingState("units", true);
  unitsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    let query = supabase
      .from("units")
      .select("*")
      .order("order_index", { ascending: true });

    if (moduleId) {
      query = query.eq("module_id", moduleId);
    }

    const { data: units, error } = await query;

    if (error) {
      setDataError("units", error.message);
      unitsStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error };
    }

    
    unitsStore.update((state) => ({
      ...state,
      units: units || [],
      loading: false,
    }));

    // Only mark as loaded if this was a full load (not filtered)
    if (!moduleId) {
      setDataLoaded("units");
    }

    return { data: units, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load units";
    
    setDataError("units", errorMessage);
    unitsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new unit
 */
export async function createUnit(
  unit: Omit<Unit, "id" | "created_at" | "updated_at" | "order_index" | "slug">
) {
  unitsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    // Generate slug from title
    const slug = generateSlug(unit.title);

    // Get the next order index for this module
    const { data: currentUnits, error: countError } = await supabase
      .from("units")
      .select("order_index")
      .eq("module_id", unit.module_id)
      .order("order_index", { ascending: false })
      .limit(1);

    if (countError) {
      throw new Error(countError.message);
    }

    const nextOrderIndex = (currentUnits?.[0]?.order_index || 0) + 1;

    const newUnitData = {
      ...unit,
      slug,
      order_index: nextOrderIndex,
    };

    const { data: newUnit, error } = await supabase
      .from("units")
      .insert(newUnitData)
      .select()
      .single();

    if (error) {
      unitsStore.update((state) => ({
        ...state,
        loading: false,
        error: error.message,
      }));
      return { data: null, error: error.message };
    }

    

    // Refresh the units list
    await loadUnits();

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
 * Update a unit
 */
export async function updateUnit(id: string, updates: Partial<Unit>) {

  try {
    const { data: updatedUnit, error } = await supabase
      .from("units")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    

    // Refresh the units list
    await loadUnits();

    return { data: updatedUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update unit";
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a unit
 */
export async function deleteUnit(id: string) {

  try {
    const { error } = await supabase.from("units").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    

    // Refresh the units list
    await loadUnits();

    return { data: { id }, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete unit";
    return { data: null, error: errorMessage };
  }
}

/**
 * Reorder units
 */
export async function reorderUnits(unitIds: string[]) {

  try {
    // Update each unit's order_index
    for (let i = 0; i < unitIds.length; i++) {
      const { error } = await supabase
        .from("units")
        .update({ order_index: i + 1 })
        .eq("id", unitIds[i]);

      if (error) {
        return { data: null, error: error.message };
      }
    }

    

    // Refresh the units list
    await loadUnits();

    return { data: unitIds, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reorder units";
    return { data: null, error: errorMessage };
  }
}

/**
 * Toggle unit publication status
 */
export async function toggleUnitPublication(id: string) {

  try {
    // Get current unit
    const { data: currentUnit, error: fetchError } = await supabase
      .from("units")
      .select("is_published")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    const newPublishedStatus = !currentUnit.is_published;

    const { data: updatedUnit, error } = await supabase
      .from("units")
      .update({
        is_published: newPublishedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    

    // Refresh the units list
    await loadUnits();

    return { data: updatedUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle publication";
    return { data: null, error: errorMessage };
  }
}

/**
 * Set the selected unit
 */
export function setSelectedUnit(unit: Unit | null) {
  unitsStore.update((state) => ({ ...state, selectedUnit: unit }));
}

/**
 * Clear any error in the store
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

  if (!unit.title?.trim()) {
    errors.push("Title is required");
  }

  if (!unit.module_id) {
    errors.push("Module is required");
  }

  if (unit.estimated_duration_minutes && unit.estimated_duration_minutes < 1) {
    errors.push("Duration must be at least 1 minute");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get unit statistics (mock implementation for now)
 */
export async function getUnitStats(unitId: string) {
  // This would typically fetch from analytics or progress tables
  return {
    totalStudents: 0,
    averageCompletionTime: 0,
    completionRate: 0,
  };
}

/**
 * Duplicate a unit
 */
export async function duplicateUnit(unitId: string) {

  try {
    // Get the original unit
    const { data: originalUnit, error: fetchError } = await supabase
      .from("units")
      .select("*")
      .eq("id", unitId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    // Create duplicate with modified title
    const duplicateData = {
      ...originalUnit,
      id: undefined, // Let Supabase generate new ID
      title: `${originalUnit.title} (Copy)`,
      slug: generateSlug(`${originalUnit.title} (Copy)`),
      is_published: false,
      created_at: undefined, // Let Supabase set this
      updated_at: undefined, // Let Supabase set this
    };

    const { data: newUnit, error } = await supabase
      .from("units")
      .insert(duplicateData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    

    // Refresh the units list
    await loadUnits();

    return { data: newUnit, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to duplicate unit";
    return { data: null, error: errorMessage };
  }
}

/**
 * Get units by module (helper function)
 */
export function getUnitsByModule(moduleId: string): Unit[] {
  const state = get(unitsStore);
  return state.units.filter((unit: Unit) => unit.module_id === moduleId);
}
