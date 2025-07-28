import { writable, derived } from "svelte/store";
import { authStore } from "./auth";

interface DataLoadingState {
  isLoading: boolean;
  lastLoaded: number | null;
  error: string | null;
  retryCount: number;
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
}

const initialLoadingState: DataLoadingState = {
  isLoading: false,
  lastLoaded: null,
  error: null,
  retryCount: 0,
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
  isLoading: boolean
) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      isLoading,
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
      error,
      retryCount: state[dataType].retryCount + 1,
    },
  }));
}

export function setDataLoaded(dataType: keyof DataManagerState) {
  dataManagerStore.update((state) => ({
    ...state,
    [dataType]: {
      ...state[dataType],
      isLoading: false,
      lastLoaded: Date.now(),
      error: null,
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

// Check if data needs to be refreshed (older than 5 minutes)
export function shouldRefreshData(dataType: keyof DataManagerState): boolean {
  let currentState: DataManagerState;
  dataManagerStore.subscribe((state) => {
    currentState = state;
  })();

  const lastLoaded = currentState[dataType].lastLoaded;
  if (!lastLoaded) {
    return true;
  } else {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastLoaded < fiveMinutesAgo;
  }
}

// Reset all loading states
export function resetDataManager() {
  dataManagerStore.set(initialState);
}

// Get loading state for a specific data type
export function getLoadingState(
  dataType: keyof DataManagerState
): DataLoadingState {
  let currentState: DataManagerState;
  dataManagerStore.subscribe((dataManager) => {
    currentState = dataManager;
  })();
  return currentState[dataType];
}
