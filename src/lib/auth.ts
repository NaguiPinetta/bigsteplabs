import { supabase } from "./supabase";
import { browser } from "$app/environment";
import type { Session } from "@supabase/supabase-js";

// Helper function to get the correct redirect URL based on environment
function getRedirectUrl(redirectTo?: string): string {
  const baseUrl = window.location.origin;
  const callbackPath = "/auth/callback";

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
    console.log("🔍 Handling magic link authentication");

    // Check for hash fragment (older Supabase versions)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      console.log("🔍 Found tokens in hash fragment");
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
        console.log("✅ Hash authentication successful");
        return { success: true, session: data.session };
      }
    }

    // Check for query parameters (newer Supabase versions)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const next = urlParams.get("next");

    if (code) {
      console.log("🔍 Found auth code in query parameters");
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
        console.log("✅ Code exchange successful");
        return {
          success: true,
          session: data.session,
          next: next || undefined,
        };
      }
    }

    console.log("❌ No authentication tokens found");
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
    console.log("🔍 Processing access token authentication...");
    console.log("🔍 Token details:", {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
    });

    // Set the session manually
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    console.log("🔍 setSession result:", {
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

    console.log("✅ Access token authentication successful");
    console.log("🔍 Session user:", {
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
    console.log("🔍 Processing code authentication...");

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

    console.log("✅ Code authentication successful");

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
    console.log("🔍 Ensuring user profile exists");

    // Check if user profile exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // User doesn't exist, create profile
      console.log("🔍 Creating new user profile");
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: session.user.id,
          email: session.user.email || "",
          role: "Student", // Default role
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

      console.log("✅ User profile created successfully");
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

    console.log("✅ User profile already exists");
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
    console.log("🔍 Sending magic link to:", email);

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
      // Use production redirect
      callbackUrl = redirectTo
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo
          )}`
        : `${window.location.origin}/auth/callback`;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: true,
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

    console.log("✅ Magic link sent successfully");
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
    console.log("🔍 Signing out user...");

    await supabase.auth.signOut();

    const redirectUrl = redirectTo || "/auth/login";
    console.log("🔄 Redirecting to:", redirectUrl);

    // await goto(redirectUrl, { replaceState: true }); // This line was removed as per the new_code
  } catch (error) {
    console.error("❌ Sign out error:", error);
    // Still redirect even if sign out fails
    // await goto("/auth/login", { replaceState: true }); // This line was removed as per the new_code
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      console.log("🔍 User already authenticated, redirecting to dashboard");
      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error("❌ Redirect check failed:", error);
  }
}

export async function redirectUnauthenticatedUser(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.log("🔍 User not authenticated, redirecting to login");
      window.location.href = "/auth/login";
    }
  } catch (error) {
    console.error("❌ Redirect check failed:", error);
  }
}
