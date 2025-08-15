// =====================================================
// AUTH DEBUG UTILITY
// Temporary helper for debugging authentication issues
// Remove this file after fixing auth problems
// =====================================================

export function logAuthError(context: string, err: unknown) {
  const msg =
    err && typeof err === "object" && "message" in err
      ? (err as any).message
      : String(err);

  console.warn(`[AUTH DEBUG] ${context}:`, msg);

  // Log additional context for debugging
  if (err && typeof err === "object") {
    console.warn(`[AUTH DEBUG] Error type:`, err.constructor?.name);
    console.warn(`[AUTH DEBUG] Error details:`, err);
  }
}

export function logAuthSuccess(context: string, data?: any) {
  console.log(`[AUTH DEBUG] ${context}: Success`, data ? "(with data)" : "");
  if (data) {
    console.log(`[AUTH DEBUG] Data:`, data);
  }
}

export function logAuthAttempt(context: string, details?: any) {
  console.log(`[AUTH DEBUG] ${context}: Attempting`, details ? details : "");
}
