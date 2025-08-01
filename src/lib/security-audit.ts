/**
 * Security Audit Utility for BigStepLabs
 * This file contains functions to audit and fix security issues
 */

import { supabase } from "$lib/supabase";

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "authentication"
    | "authorization"
    | "data-exposure"
    | "input-validation"
    | "configuration";
  title: string;
  description: string;
  location?: string;
  fix?: string;
  status: "open" | "fixed" | "ignored";
}

export interface SecurityAuditResult {
  issues: SecurityIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

/**
 * Perform a comprehensive security audit
 */
export async function performSecurityAudit(): Promise<SecurityAuditResult> {
  const issues: SecurityIssue[] = [];

  // Check for sensitive data in console logs
  issues.push(...checkSensitiveLogging());

  // Check authentication and authorization
  issues.push(...(await checkAuthSecurity()));

  // Check data exposure
  issues.push(...checkDataExposure());

  // Check input validation
  issues.push(...checkInputValidation());

  // Check configuration issues
  issues.push(...checkConfigurationIssues());

  const summary = {
    total: issues.length,
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };

  const recommendations = generateRecommendations(issues);

  return {
    issues,
    summary,
    recommendations,
  };
}

/**
 * Check for sensitive data being logged
 */
function checkSensitiveLogging(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check if console.log is used in production
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    issues.push({
      id: "console-logging-prod",
      severity: "medium",
      category: "data-exposure",
      title: "Console logging in production",
      description:
        "Console.log statements may expose sensitive information in production builds",
      location: "Multiple files",
      fix: "Remove or conditionally disable console.log statements in production",
      status: "open",
    });
  }

  return issues;
}

/**
 * Check authentication and authorization security
 */
async function checkAuthSecurity(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  try {
    // Check if user is properly authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      issues.push({
        id: "no-auth-session",
        severity: "critical",
        category: "authentication",
        title: "No authentication session",
        description: "User is not properly authenticated",
        status: "open",
      });
    } else {
      // Check if session is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        issues.push({
          id: "expired-session",
          severity: "high",
          category: "authentication",
          title: "Expired authentication session",
          description: "User session has expired and should be refreshed",
          status: "open",
        });
      }
    }
  } catch (error) {
    issues.push({
      id: "auth-check-failed",
      severity: "high",
      category: "authentication",
      title: "Authentication check failed",
      description: `Failed to verify authentication status: ${error}`,
      status: "open",
    });
  }

  return issues;
}

/**
 * Check for data exposure vulnerabilities
 */
function checkDataExposure(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for localStorage usage with sensitive data
  if (typeof window !== "undefined") {
    const sensitiveKeys = ["token", "password", "secret", "key", "auth"];
    const localStorageKeys = Object.keys(localStorage);

    for (const key of localStorageKeys) {
      for (const sensitive of sensitiveKeys) {
        if (key.toLowerCase().includes(sensitive)) {
          issues.push({
            id: "localstorage-sensitive-data",
            severity: "high",
            category: "data-exposure",
            title: "Sensitive data in localStorage",
            description: `LocalStorage key "${key}" may contain sensitive information`,
            location: "localStorage",
            fix: "Remove sensitive data from localStorage or encrypt it",
            status: "open",
          });
          break;
        }
      }
    }
  }

  return issues;
}

/**
 * Check input validation
 */
function checkInputValidation(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for potential XSS vulnerabilities
  issues.push({
    id: "input-validation-xss",
    severity: "medium",
    category: "input-validation",
    title: "Input validation for XSS",
    description:
      "Ensure all user inputs are properly sanitized to prevent XSS attacks",
    location: "Forms and user inputs",
    fix: "Implement proper input sanitization and validation",
    status: "open",
  });

  return issues;
}

/**
 * Check configuration issues
 */
function checkConfigurationIssues(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for exposed environment variables
  const exposedVars = [
    "VITE_SUPABASE_ANON_KEY",
    "VITE_OPENAI_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  for (const varName of exposedVars) {
    if (typeof window !== "undefined" && (window as any)[varName]) {
      issues.push({
        id: `exposed-env-${varName}`,
        severity: "critical",
        category: "configuration",
        title: `Exposed environment variable: ${varName}`,
        description: `Environment variable ${varName} is exposed to the client`,
        location: "Client-side code",
        fix: "Move sensitive environment variables to server-side only",
        status: "open",
      });
    }
  }

  return issues;
}

/**
 * Generate security recommendations
 */
function generateRecommendations(issues: SecurityIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some((i) => i.severity === "critical")) {
    recommendations.push(
      "🔴 CRITICAL: Address all critical security issues immediately"
    );
  }

  if (issues.some((i) => i.category === "authentication")) {
    recommendations.push(
      "🔐 Implement proper session management and token refresh"
    );
  }

  if (issues.some((i) => i.category === "data-exposure")) {
    recommendations.push(
      "🔒 Review and secure all data storage and transmission"
    );
  }

  if (issues.some((i) => i.category === "input-validation")) {
    recommendations.push(
      "✅ Implement comprehensive input validation and sanitization"
    );
  }

  recommendations.push("🛡️ Enable Content Security Policy (CSP) headers");
  recommendations.push(
    "🔍 Implement regular security audits and penetration testing"
  );
  recommendations.push("📚 Provide security training for development team");

  return recommendations;
}

/**
 * Fix common security issues
 */
export async function fixSecurityIssues(): Promise<{
  fixed: number;
  errors: string[];
}> {
  let fixed = 0;
  const errors: string[] = [];

  try {
    // Clear sensitive data from localStorage
    if (typeof window !== "undefined") {
      const sensitiveKeys = ["token", "password", "secret", "key", "auth"];
      const localStorageKeys = Object.keys(localStorage);

      for (const key of localStorageKeys) {
        for (const sensitive of sensitiveKeys) {
          if (key.toLowerCase().includes(sensitive)) {
            localStorage.removeItem(key);
            fixed++;
            break;
          }
        }
      }
    }

    // Clear console logs in production
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      fixed++;
    }
  } catch (error) {
    errors.push(`Failed to fix security issues: ${error}`);
  }

  return { fixed, errors };
}

/**
 * Get security status summary
 */
export function getSecurityStatus(): {
  status: "secure" | "warning" | "critical";
  message: string;
} {
  // This would be implemented based on the audit results
  return {
    status: "warning",
    message: "Security audit recommended - some issues may need attention",
  };
}
