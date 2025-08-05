import { supabase } from "./supabase";
import { browser } from "$app/environment";
import type { Session } from "@supabase/supabase-js";

// Helper function to get the correct redirect URL based on environment
function getRedirectUrl(redirectTo?: string): string {
  const baseUrl = window.location.origin;
  const callbackPath = "/auth/callback";

  // Ensure we have a valid base URL
  if (!baseUrl || baseUrl === "null") {
    console.warn("Invalid base URL detected, using fallback");
    return redirectTo
      ? `https://your-production-domain.com${callbackPath}?next=${encodeURIComponent(
          redirectTo
        )}`
      : `https://your-production-domain.com${callbackPath}`;
  }

  if (redirectTo) {
    return `${baseUrl}${callbackPath}?next=${encodeURIComponent(redirectTo)}`;
  }

  return `${baseUrl}${callbackPath}`;
}

interface AuthError {
  type:
    | "no_code"
    | "invalid_link"
    | "exchange_failed"
    | "network_error"
    | "unknown"
    | "auth_error"
    | "no_tokens"
    | "profile_creation_error"
    | "profile_fetch_error";
  message: string;
  details?: any;
}

interface AuthResult {
  success: boolean;
  error?: AuthError;
  session?: Session;
  user?: any;
  next?: string;
}

/**
 * Handle magic link authentication from URL parameters
 */
export async function handleMagicLinkAuth(): Promise<AuthResult> {
  try {

    // Check for hash fragment (older Supabase versions)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("❌ Hash auth failed:", error.message);
        return {
          success: false,
          error: {
            type: "auth_error",
            message: error.message,
            details: error,
          },
        };
      }

      if (data.session) {
        return { success: true, session: data.session };
      }
    }

    // Check for query parameters (newer Supabase versions)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const next = urlParams.get("next");

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Code exchange failed:", error.message);
        return {
          success: false,
          error: {
            type: "auth_error",
            message: error.message,
            details: error,
          },
        };
      }

      if (data.session) {
        return {
          success: true,
          session: data.session,
          next: next || undefined,
        };
      }
    }

    return {
      success: false,
      error: {
        type: "no_tokens",
        message: "No authentication tokens found in URL",
      },
    };
  } catch (error) {
    console.error("❌ Magic link auth error:", error);
    return {
      success: false,
      error: {
        type: "network_error",
        message: "Authentication failed",
        details: error,
      },
    };
  }
}

/**
 * Handle authentication using access token (new Supabase format)
 */
async function handleAccessTokenAuth(
  accessToken: string,
  refreshToken: string
): Promise<AuthResult> {
  try {

    // Set the session manually
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    console.log({
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message,
    });

    if (error) {
      console.error("❌ Access token auth failed:", error);
      return {
        success: false,
        error: {
          type: "exchange_failed",
          message: error.message,
          details: error,
        },
      };
    }

    if (!data.session) {
      console.error("❌ No session returned from access token");
      return {
        success: false,
        error: {
          type: "invalid_link",
          message: "Invalid or expired authentication token",
        },
      };
    }

    console.log({
      id: data.session.user.id,
      email: data.session.user.email,
    });

    // Create user profile if needed
    await ensureUserProfile(data.session);

    // Update the auth store to prevent timeout - only set session, let store handle user
    // setSessionManually(data.session, null); // This line was removed as per the new_code

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    console.error("❌ Access token auth error:", error);
    return {
      success: false,
      error: {
        type: "exchange_failed",
        message: "Failed to process authentication token",
        details: error,
      },
    };
  }
}

/**
 * Handle authentication using code (legacy Supabase format)
 */
async function handleCodeAuth(code: string): Promise<AuthResult> {
  try {

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("❌ Code exchange failed:", error);
      return {
        success: false,
        error: {
          type: "exchange_failed",
          message: error.message,
          details: error,
        },
      };
    }

    if (!data.session) {
      console.error("❌ No session returned from code exchange");
      return {
        success: false,
        error: {
          type: "invalid_link",
          message: "Invalid or expired authentication code",
        },
      };
    }

    console.log("✅ Code exchange successful, session created");

    // Create user profile if needed
    await ensureUserProfile(data.session);

    // Update the auth store to prevent timeout - only set session, let store handle user
    // setSessionManually(data.session, null); // This line was removed as per the new_code

    return {
      success: true,
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    console.error("❌ Code auth error:", error);
    return {
      success: false,
      error: {
        type: "exchange_failed",
        message: "Failed to exchange code for session",
        details: error,
      },
    };
  }
}

/**
 * Ensure user profile exists in our users table
 */
export async function ensureUserProfile(session: Session): Promise<AuthResult> {
  try {

    // Check if user profile exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // User doesn't exist, create profile

      // Check if user is in allowlist to get their role
      const { data: allowlistEntry } = await supabase
        .from("allowlist")
        .select("role")
        .eq("email", session.user.email)
        .single();

      const role = allowlistEntry?.role || "Student"; // Default to Student if not in allowlist

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: session.user.id,
          email: session.user.email || "",
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Failed to create user profile:", createError.message);
        return {
          success: false,
          error: {
            type: "profile_creation_error",
            message: "Failed to create user profile",
            details: createError,
          },
        };
      }


      // Remove user from allowlist if they were allowlisted
      if (allowlistEntry) {
        const { error: deleteError } = await supabase
          .from("allowlist")
          .delete()
          .eq("email", session.user.email);

        if (deleteError) {
          console.error("❌ Failed to remove from allowlist:", deleteError);
        } else {
        }
      }

      return { success: true, user: newUser };
    } else if (fetchError) {
      console.error("❌ Failed to fetch user profile:", fetchError.message);
      return {
        success: false,
        error: {
          type: "profile_fetch_error",
          message: "Failed to fetch user profile",
          details: fetchError,
        },
      };
    }

    return { success: true, user: existingUser };
  } catch (error) {
    console.error("❌ User profile error:", error);
    return {
      success: false,
      error: {
        type: "network_error",
        message: "Failed to ensure user profile",
        details: error,
      },
    };
  }
}

/**
 * Send magic link to user's email
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string
): Promise<AuthResult> {
  try {

    // Detect mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Determine the correct callback URL based on environment
    let callbackUrl;
    if (window.location.origin.includes("localhost")) {
      // Force localhost redirect
      callbackUrl = redirectTo
        ? `http://localhost:5173/auth/callback?next=${encodeURIComponent(
            redirectTo
          )}`
        : `http://localhost:5173/auth/callback`;
    } else {
      // Use production redirect with mobile consideration
      const baseUrl = window.location.origin;
      callbackUrl = redirectTo
        ? `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `${baseUrl}/auth/callback`;
    }


    // Allow user creation for magic links - the allowlist check will be handled in the auth callback
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: true, // Allow creation for new users
      },
    });

    if (error) {
      console.error("❌ Magic link send failed:", error.message);
      return {
        success: false,
        error: {
          type: "network_error",
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Magic link send error:", error);
    return {
      success: false,
      error: {
        type: "network_error",
        message: "Failed to send magic link",
        details: error,
      },
    };
  }
}

/**
 * Sign out user and redirect
 */
export async function signOut(redirectTo?: string): Promise<void> {
  try {

    // Clear any stored session data first
    if (typeof window !== "undefined") {
      // Clear any auth-related localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("auth"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear sessionStorage as well
      sessionStorage.clear();
    }

    // Clear cookies if possible
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes("supabase") || name.includes("auth")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }

    // Sign out from Supabase with error handling
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Supabase sign out error:", error);
        // Continue with local cleanup even if Supabase fails
      } else {
      }
    } catch (supabaseError) {
      console.error("❌ Supabase sign out exception:", supabaseError);
      // Continue with local cleanup even if Supabase fails
    }

    const redirectUrl = redirectTo || "/auth/login";

    // Use window.location for hard redirect to ensure complete session cleanup
    if (typeof window !== "undefined") {
      // Force a complete page reload to clear any cached auth state
      window.location.replace(redirectUrl);
    }
  } catch (error) {
    console.error("❌ Sign out error:", error);
    // Force redirect even if everything fails
    if (typeof window !== "undefined") {
      window.location.replace(redirectTo || "/auth/login");
    }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<any> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Get session error:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("❌ Get session error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session;
}

export async function redirectAuthenticatedUser(): Promise<void> {
  try {

    // Check if we're already on the login page to prevent loops
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/auth/login"
    ) {
      return;
    }

    // Check both Supabase session and auth store
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log({
      hasSession: !!session,
      userId: session?.user?.id,
    });

    if (session) {

      // Use replace to prevent back button issues
      if (typeof window !== "undefined") {
        window.location.replace("/dashboard");
      }
    } else {
      // Don't redirect to login if we're already on login page
    }
  } catch (error) {
    console.error("❌ Redirect check failed:", error);
    // Don't redirect on error to prevent loops
  }
}

export async function redirectUnauthenticatedUser(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/auth/login";
    }
  } catch (error) {
    console.error("❌ Redirect check failed:", error);
  }
}
