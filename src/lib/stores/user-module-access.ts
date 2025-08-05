import { writable, derived, get } from "svelte/store";
import { supabase } from "../supabase";
import { authStore } from "./auth";
import { safeDataLoad } from "./data-manager";

interface UserModuleAccess {
  assignedModuleIds: string[];
  accessibleModules: any[];
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
}

const initialState: UserModuleAccess = {
  assignedModuleIds: [],
  accessibleModules: [],
  loading: false,
  error: null,
  lastLoaded: null,
};

export const userModuleAccessStore = writable<UserModuleAccess>(initialState);

// Track loading state to prevent multiple loads
let isLoading = false;

/**
 * Load user's accessible modules
 */
export async function loadUserModuleAccess(): Promise<void> {
  const auth = get(authStore);

  if (!auth.user) {
    userModuleAccessStore.set(initialState);
    return;
  }

  // Prevent multiple concurrent loads
  if (isLoading) {
    return;
  }

  isLoading = true;
  userModuleAccessStore.update((state) => ({
    ...state,
    loading: true,
    error: null,
  }));

  try {

    // Use safe data loading to prevent race conditions
    const data = await safeDataLoad(
      "userModuleAccess",
      async () => {
        // Call the database function to get accessible modules
        const { data, error } = await supabase.rpc(
          "get_user_accessible_modules",
          {
            user_uuid: auth.user!.id,
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        return data || [];
      },
      false // Don't force refresh unless needed
    );

    const accessibleModules = data;
    const assignedModuleIds = accessibleModules.map(
      (module: any) => module.module_id
    );

    console.log({
      accessibleModules: accessibleModules.length,
      assignedModuleIds: assignedModuleIds.length,
    });

    userModuleAccessStore.update((state) => ({
      ...state,
      assignedModuleIds,
      accessibleModules,
      loading: false,
      error: null,
      lastLoaded: Date.now(),
    }));
  } catch (error) {
    userModuleAccessStore.update((state) => ({
      ...state,
      loading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
  } finally {
    isLoading = false;
  }
}

/**
 * Check if user has access to a specific module
 */
export async function checkModuleAccess(moduleId: string): Promise<boolean> {
  const auth = get(authStore);

  if (!auth.user) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc("user_has_module_access", {
      user_uuid: auth.user.id,
      module_uuid: moduleId,
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Filter modules based on user access
 */
export function filterModulesByAccess(allModules: any[]): any[] {
  const access = get(userModuleAccessStore);

  // If still loading, return empty array
  if (access.loading) {
    return [];
  }

  // If there's an error, return all modules (fail open for now)
  if (access.error) {
    console.log(
      "⚠️ Error in module access, showing all modules:",
      access.error
    );
    return allModules;
  }

  // Filter modules based on assigned module IDs
  const filteredModules = allModules.filter((module) =>
    access.assignedModuleIds.includes(module.id)
  );

  console.log({
    total: allModules.length,
    accessible: filteredModules.length,
    assignedIds: access.assignedModuleIds,
  });

  return filteredModules;
}

/**
 * Clear user module access data
 */
export function clearUserModuleAccess(): void {
  isLoading = false;
  userModuleAccessStore.set(initialState);
}

// Derived store for filtered modules
export const accessibleModules = derived(
  [userModuleAccessStore],
  ([$userModuleAccess]) => $userModuleAccess
);
