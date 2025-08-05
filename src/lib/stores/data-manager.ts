import { writable, derived, get } from "svelte/store";
import { authStore } from "./auth";

interface DataLoadingState {
  isLoading: boolean;
  lastLoaded: number | null;
  error: string | null;
  retryCount: number;
  data: any | null; // Store actual data to prevent vanishing
  loadingPromise: Promise<any> | null; // Track ongoing loading promises
}

interface DataManagerState {
  modules: DataLoadingState;
  units: DataLoadingState;
  content: DataLoadingState;
  agents: DataLoadingState;
  datasets: DataLoadingState;
  models: DataLoadingState;
  personas: DataLoadingState;
  files: DataLoadingState;
  chatSessions: DataLoadingState;
  lessons: DataLoadingState;
  userModuleAccess: DataLoadingState;
}

const initialLoadingState: DataLoadingState = {
  isLoading: false,
  lastLoaded: null,
  error: null,
  retryCount: 0,
  data: null,
  loadingPromise: null,
};

const initialState: DataManagerState = {
  modules: { ...initialLoadingState },
  units: { ...initialLoadingState },
  content: { ...initialLoadingState },
  agents: { ...initialLoadingState },
  datasets: { ...initialLoadingState },
  models: { ...initialLoadingState },
  personas: { ...initialLoadingState },
  files: { ...initialLoadingState },
  chatSessions: { ...initialLoadingState },
  lessons: { ...initialLoadingState },
  userModuleAccess: { ...initialLoadingState },
};

export const dataManagerStore = writable<DataManagerState>(initialState);

// Derived store to check if any data is currently loading
export const isAnyDataLoading = derived(dataManagerStore, ($dataManager) => {
  return Object.values($dataManager).some((state) => state.isLoading);
});

// Derived store to check if user can manage content and auth is ready
export const canLoadData = derived(authStore, ($authStore) => {
  const user = $authStore.user;
  const canManage = user?.role === "Admin" || user?.role === "Collaborator";
  const authReady = $authStore.initialized && !$authStore.loading;

  return {
    canManage,
    authReady,
    shouldLoad: canManage && authReady,
    user: user,
  };
});

// Helper functions to manage loading states
export function setLoadingState(
  dataType: keyof DataManagerState,
  isLoading: boolean,
  loadingPromise?: Promise<any>
) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      isLoading,
      loadingPromise: isLoading ? loadingPromise || null : null,
      error: isLoading ? null : state[dataType].error,
    },
  }));
}

export function setDataError(dataType: keyof DataManagerState, error: string) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      isLoading: false,
      loadingPromise: null,
      error,
      retryCount: state[dataType].retryCount + 1,
    },
  }));
}

export function setDataLoaded(dataType: keyof DataManagerState, data?: any) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      isLoading: false,
      loadingPromise: null,
      lastLoaded: Date.now(),
      error: null,
      data: data !== undefined ? data : state[dataType].data, // Preserve existing data if not provided
    },
  }));
}

export function clearDataError(dataType: keyof DataManagerState) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      error: null,
    },
  }));
}

// Check if data needs to be refreshed (older than 10 minutes instead of 5)
export function shouldRefreshData(dataType: keyof DataManagerState): boolean {
  const currentState = get(dataManagerStore);
  const lastLoaded = currentState[dataType].lastLoaded;

  if (!lastLoaded) {
    return true;
  } else {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // Increased from 5 to 10 minutes
    return lastLoaded < tenMinutesAgo;
  }
}

// Get cached data if available and not stale
export function getCachedData(dataType: keyof DataManagerState): any | null {
  const currentState = get(dataManagerStore);
  const state = currentState[dataType];

  if (state.data && !shouldRefreshData(dataType)) {
    return state.data;
  }

  return null;
}

// Check if data is currently loading to prevent race conditions
export function isDataLoading(dataType: keyof DataManagerState): boolean {
  const currentState = get(dataManagerStore);
  return currentState[dataType].isLoading;
}

// Get the current loading promise to prevent duplicate loads
export function getLoadingPromise(
  dataType: keyof DataManagerState
): Promise<any> | null {
  const currentState = get(dataManagerStore);
  return currentState[dataType].loadingPromise;
}

// Reset all loading states
export function resetDataManager() {
  dataManagerStore.set(initialState);
}

// Reset specific data type loading state
export function resetDataType(dataType: keyof DataManagerState) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...initialLoadingState,
    },
  }));
}

// Get loading state for a specific data type
export function getLoadingState(
  dataType: keyof DataManagerState
): DataLoadingState {
  const currentState = get(dataManagerStore);
  return currentState[dataType];
}

// Force refresh data regardless of cache
export function forceRefreshData(dataType: keyof DataManagerState) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      lastLoaded: null, // Force refresh by clearing lastLoaded
    },
  }));
}

// Enhanced data loading function that prevents race conditions
export async function safeDataLoad<T>(
  dataType: keyof DataManagerState,
  loader: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  // Check if already loading
  if (isDataLoading(dataType)) {
    const existingPromise = getLoadingPromise(dataType);
    if (existingPromise) {
      console.log(
        `🔄 ${dataType}: Already loading, waiting for existing promise...`
      );
      return existingPromise;
    }
  }

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getCachedData(dataType);
    if (cachedData) {
      return cachedData;
    }
  }

  // Check if we should refresh
  if (!forceRefresh && !shouldRefreshData(dataType)) {
    const cachedData = getCachedData(dataType);
    if (cachedData) {
      return cachedData;
    }
  }


  // Create loading promise
  const loadingPromise = loader()
    .then((data) => {
      console.log(`✅ ${dataType}: Data loaded successfully`);
      setDataLoaded(dataType, data);
      return data;
    })
    .catch((error) => {
      setDataError(dataType, error.message || "Unknown error");
      throw error;
    });

  // Set loading state with promise
  setLoadingState(dataType, true, loadingPromise);

  return loadingPromise;
}

// Make debug functions available globally
if (typeof window !== "undefined") {
  (window as any).resetDataManager = resetDataManager;
  (window as any).resetDataType = resetDataType;
  (window as any).getLoadingState = getLoadingState;
  (window as any).forceRefreshData = forceRefreshData;
  (window as any).getCachedData = getCachedData;
  (window as any).safeDataLoad = safeDataLoad;
  (window as any).isDataLoading = isDataLoading;
}
