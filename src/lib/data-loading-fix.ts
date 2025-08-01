/**
 * Data Loading Fix Utility
 * Addresses issues with data vanishing and loading problems
 */

import { get } from "svelte/store";
import { authStore } from "./stores/auth";
import {
  dataManagerStore,
  forceRefreshData,
  getCachedData,
} from "./stores/data-manager";

export interface DataLoadingIssue {
  type:
    | "race-condition"
    | "cache-stale"
    | "auth-mismatch"
    | "network-error"
    | "store-reset";
  description: string;
  severity: "high" | "medium" | "low";
  fix: string;
}

export interface DataLoadingDiagnostic {
  issues: DataLoadingIssue[];
  recommendations: string[];
  cacheStatus: Record<string, any>;
  authStatus: any;
}

/**
 * Diagnose data loading issues
 */
export function diagnoseDataLoadingIssues(): DataLoadingDiagnostic {
  const issues: DataLoadingIssue[] = [];
  const recommendations: string[] = [];

  // Check auth status
  const auth = get(authStore);
  const authStatus = {
    hasSession: !!auth.session,
    hasUser: !!auth.user,
    initialized: auth.initialized,
    loading: auth.loading,
    userRole: auth.user?.role,
  };

  // Check data manager status
  const dataManager = get(dataManagerStore);
  const cacheStatus: Record<string, any> = {};

  Object.entries(dataManager).forEach(([key, state]) => {
    cacheStatus[key] = {
      hasData: !!state.data,
      dataLength: state.data?.length || 0,
      lastLoaded: state.lastLoaded,
      isLoading: state.isLoading,
      hasError: !!state.error,
      retryCount: state.retryCount,
    };

    // Check for specific issues
    if (state.isLoading && state.data) {
      issues.push({
        type: "race-condition",
        description: `${key} is loading while having cached data`,
        severity: "medium",
        fix: "Prevent concurrent loading operations",
      });
    }

    if (state.error && state.retryCount > 3) {
      issues.push({
        type: "network-error",
        description: `${key} has failed to load ${state.retryCount} times`,
        severity: "high",
        fix: "Check network connectivity and API endpoints",
      });
    }

    if (!state.data && !state.isLoading && !state.error) {
      issues.push({
        type: "store-reset",
        description: `${key} has no data and is not loading`,
        severity: "medium",
        fix: "Data may have been reset unexpectedly",
      });
    }
  });

  // Check auth-data consistency
  if (
    auth.initialized &&
    !auth.loading &&
    !auth.user &&
    Object.values(cacheStatus).some((c) => c.hasData)
  ) {
    issues.push({
      type: "auth-mismatch",
      description: "User not authenticated but data is cached",
      severity: "high",
      fix: "Clear cached data when user logs out",
    });
  }

  // Generate recommendations
  if (issues.some((i) => i.severity === "high")) {
    recommendations.push(
      "🔴 HIGH PRIORITY: Address high severity data loading issues"
    );
  }

  if (issues.some((i) => i.type === "race-condition")) {
    recommendations.push(
      "⚡ Implement proper loading state management to prevent race conditions"
    );
  }

  if (issues.some((i) => i.type === "cache-stale")) {
    recommendations.push("🔄 Implement cache invalidation strategy");
  }

  recommendations.push("📊 Monitor data loading performance and errors");
  recommendations.push(
    "🛡️ Implement retry mechanisms with exponential backoff"
  );

  return {
    issues,
    recommendations,
    cacheStatus,
    authStatus,
  };
}

/**
 * Fix common data loading issues
 */
export async function fixDataLoadingIssues(): Promise<{
  fixed: number;
  errors: string[];
}> {
  let fixed = 0;
  const errors: string[] = [];

  try {
    // Clear stale cache entries
    const dataManager = get(dataManagerStore);
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    Object.entries(dataManager).forEach(([key, state]) => {
      if (state.lastLoaded && state.lastLoaded < tenMinutesAgo) {
        forceRefreshData(key as any);
        fixed++;
      }
    });

    // Clear auth-related cache if user is not authenticated
    const auth = get(authStore);
    if (!auth.user && auth.initialized) {
      // Clear all cached data when user is not authenticated
      Object.keys(dataManager).forEach((key) => {
        forceRefreshData(key as any);
      });
      fixed++;
    }
  } catch (error) {
    errors.push(`Failed to fix data loading issues: ${error}`);
  }

  return { fixed, errors };
}

/**
 * Implement robust data loading with retry mechanism
 */
export async function robustDataLoad<T>(
  loader: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await loader();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Data loading attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Data loading failed after all retries");
}

/**
 * Prevent race conditions in data loading
 */
export class DataLoadingManager {
  private loadingPromises: Map<string, Promise<any>> = new Map();

  async loadData<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // If already loading, return the existing promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key) as Promise<T>;
    }

    // Create new loading promise
    const loadingPromise = loader().finally(() => {
      this.loadingPromises.delete(key);
    });

    this.loadingPromises.set(key, loadingPromise);
    return loadingPromise;
  }

  isLoading(key: string): boolean {
    return this.loadingPromises.has(key);
  }

  clearLoading(key: string): void {
    this.loadingPromises.delete(key);
  }

  clearAll(): void {
    this.loadingPromises.clear();
  }
}

// Global instance
export const dataLoadingManager = new DataLoadingManager();

/**
 * Enhanced data loading with automatic retry and cache management
 */
export async function enhancedDataLoad<T>(
  dataType: string,
  loader: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    cacheTime?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    cacheTime = 10 * 60 * 1000, // 10 minutes
    forceRefresh = false,
  } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getCachedData(dataType as any);
    if (cachedData) {
      console.log(`🔄 Using cached ${dataType} data`);
      return cachedData;
    }
  }

  // Use robust loading with retry mechanism
  return dataLoadingManager.loadData(dataType, () =>
    robustDataLoad(loader, maxRetries, retryDelay)
  );
}

/**
 * Monitor data loading performance
 */
export class DataLoadingMonitor {
  private metrics: Map<
    string,
    {
      loadCount: number;
      errorCount: number;
      totalLoadTime: number;
      lastLoadTime: number;
      averageLoadTime: number;
    }
  > = new Map();

  recordLoad(dataType: string, loadTime: number, success: boolean): void {
    const current = this.metrics.get(dataType) || {
      loadCount: 0,
      errorCount: 0,
      totalLoadTime: 0,
      lastLoadTime: 0,
      averageLoadTime: 0,
    };

    current.loadCount++;
    current.totalLoadTime += loadTime;
    current.lastLoadTime = loadTime;
    current.averageLoadTime = current.totalLoadTime / current.loadCount;

    if (!success) {
      current.errorCount++;
    }

    this.metrics.set(dataType, current);
  }

  getMetrics(dataType?: string): any {
    if (dataType) {
      return this.metrics.get(dataType);
    }
    return Object.fromEntries(this.metrics);
  }

  getPerformanceReport(): {
    slowest: string[];
    mostErrors: string[];
    recommendations: string[];
  } {
    const entries = Array.from(this.metrics.entries());

    const slowest = entries
      .sort((a, b) => b[1].averageLoadTime - a[1].averageLoadTime)
      .slice(0, 3)
      .map(([key]) => key);

    const mostErrors = entries
      .sort((a, b) => b[1].errorCount - a[1].errorCount)
      .slice(0, 3)
      .map(([key]) => key);

    const recommendations: string[] = [];

    if (slowest.length > 0) {
      recommendations.push(`Optimize loading for: ${slowest.join(", ")}`);
    }

    if (mostErrors.length > 0) {
      recommendations.push(`Investigate errors in: ${mostErrors.join(", ")}`);
    }

    return { slowest, mostErrors, recommendations };
  }
}

// Global monitor instance
export const dataLoadingMonitor = new DataLoadingMonitor();

/**
 * Monitor and debug random loading states in real-time
 */
export class LoadingStateMonitor {
  private loadingEvents: Array<{
    timestamp: number;
    dataType: string;
    action: "start" | "end" | "error";
    duration?: number;
    error?: string;
  }> = [];

  private isMonitoring = false;

  startMonitoring() {
    if (this.isMonitoring) {
      console.log("🔄 Loading state monitor already running");
      return;
    }

    this.isMonitoring = true;
    console.log("🔍 Starting loading state monitor...");

    // Monitor auth store changes
    const authUnsubscribe = authStore.subscribe((auth) => {
      this.recordEvent("auth", "state-change", {
        hasSession: !!auth.session,
        hasUser: !!auth.user,
        loading: auth.loading,
        initialized: auth.initialized,
      });
    });

    // Monitor data manager changes
    const dataManagerUnsubscribe = dataManagerStore.subscribe((dataManager) => {
      Object.entries(dataManager).forEach(([key, state]) => {
        if (state.isLoading) {
          this.recordEvent(key, "loading-start");
        }
      });
    });

    // Store unsubscribe functions for cleanup
    this.unsubscribeFunctions = [authUnsubscribe, dataManagerUnsubscribe];

    // Log monitoring functions to console for debugging
    if (typeof window !== "undefined") {
      (window as any).getLoadingEvents = () => this.getRecentEvents();
      (window as any).clearLoadingEvents = () => this.clearEvents();
      (window as any).analyzeLoadingPatterns = () => this.analyzePatterns();
      console.log(
        "🔧 Debug: Loading state monitor functions available in console"
      );
    }
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log("🛑 Stopping loading state monitor...");

    // Unsubscribe from all stores
    if (this.unsubscribeFunctions) {
      this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      this.unsubscribeFunctions = [];
    }
  }

  private recordEvent(dataType: string, action: string, details?: any) {
    const event = {
      timestamp: Date.now(),
      dataType,
      action,
      details,
    };

    this.loadingEvents.push(event);

    // Keep only last 100 events
    if (this.loadingEvents.length > 100) {
      this.loadingEvents = this.loadingEvents.slice(-100);
    }

    // Log suspicious patterns
    this.detectSuspiciousPatterns();
  }

  private detectSuspiciousPatterns() {
    const recentEvents = this.loadingEvents.slice(-20);

    // Check for rapid auth state changes
    const authChanges = recentEvents.filter((e) => e.dataType === "auth");
    if (authChanges.length > 5) {
      console.warn(
        "⚠️ Suspicious: Multiple auth state changes detected",
        authChanges
      );
    }

    // Check for concurrent loading of same data type
    const loadingStarts = recentEvents.filter(
      (e) => e.action === "loading-start"
    );
    const dataTypeCounts = loadingStarts.reduce((acc, event) => {
      acc[event.dataType] = (acc[event.dataType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(dataTypeCounts).forEach(([dataType, count]) => {
      if (count > 3) {
        console.warn(
          `⚠️ Suspicious: Multiple loads of ${dataType} detected (${count} times)`
        );
      }
    });
  }

  getRecentEvents(minutes: number = 5): any[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.loadingEvents.filter((event) => event.timestamp > cutoff);
  }

  clearEvents(): void {
    this.loadingEvents = [];
    console.log("🧹 Loading events cleared");
  }

  analyzePatterns(): {
    totalEvents: number;
    authChanges: number;
    loadingStarts: number;
    suspiciousPatterns: string[];
  } {
    const recentEvents = this.getRecentEvents(10); // Last 10 minutes

    const authChanges = recentEvents.filter(
      (e) => e.dataType === "auth"
    ).length;
    const loadingStarts = recentEvents.filter(
      (e) => e.action === "loading-start"
    ).length;

    const suspiciousPatterns: string[] = [];

    if (authChanges > 5) {
      suspiciousPatterns.push(`High auth state changes: ${authChanges}`);
    }

    if (loadingStarts > 20) {
      suspiciousPatterns.push(`High loading activity: ${loadingStarts} loads`);
    }

    return {
      totalEvents: recentEvents.length,
      authChanges,
      loadingStarts,
      suspiciousPatterns,
    };
  }

  private unsubscribeFunctions: Array<() => void> = [];
}

// Global monitor instance
export const loadingStateMonitor = new LoadingStateMonitor();

// Auto-start monitoring in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Start monitoring after a short delay to avoid initialization noise
  setTimeout(() => {
    loadingStateMonitor.startMonitoring();
  }, 2000);
}
