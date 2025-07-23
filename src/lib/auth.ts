import { supabase } from "./supabase";
import { goto } from "$app/navigation";
import { browser } from "$app/environment";
import { setSessionManually } from "./stores/auth";

export interface AuthError {
  type:
    | "no_code"
    | "invalid_link"
    | "exchange_failed"
    | "network_error"
    | "unknown";
  message: string;
  details?: any;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
  session?: any;
  user?: any;
}

/**
 * Handle magic link authentication flow
 * Supports both URL hash (#access_token) and query parameter (?code=) formats
 */
export async function handleMagicLinkAuth(): Promise<AuthResult> {
  if (!browser) {
    return {
      success: false,
      error: { type: "unknown", message: "Not in browser environment" },
    };
  }

  try {
    console.log("🔍 Starting magic link auth flow...");

    // Check for access token in URL hash (new Supabase format)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const tokenType = hashParams.get("type");

    console.log("🔍 URL hash params:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      tokenType,
    });

    if (accessToken && refreshToken && tokenType === "magiclink") {
      console.log("✅ Found access token in URL hash");
      return await handleAccessTokenAuth(accessToken, refreshToken);
    }

    // Check for code in URL query parameters (legacy format)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    console.log("🔍 URL query params:", { code: !!code });

    if (code) {
      console.log("✅ Found code in URL query");
      return await handleCodeAuth(code);
    }

    // No authentication parameters found
    console.log("❌ No authentication parameters found");
    return {
      success: false,
      error: {
        type: "no_code",
        message: "No authentication code or token found in URL",
      },
    };
  } catch (error) {
    console.error("❌ Magic link auth error:", error);
    return {
      success: false,
      error: {
        type: "unknown",
        message: "Unexpected error during authentication",
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
    await ensureUserProfile(data.session.user);

    // Update the auth store to prevent timeout - only set session, let store handle user
    setSessionManually(data.session, null);

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
    await ensureUserProfile(data.session.user);

    // Update the auth store to prevent timeout - only set session, let store handle user
    setSessionManually(data.session, null);

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
async function ensureUserProfile(user: any): Promise<void> {
  try {
    console.log("🔍 Ensuring user profile exists...");

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // User doesn't exist, create them
      console.log("📝 Creating new user profile...");
      const { error: createError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        role: "Student", // Default role
      });

      if (createError) {
        console.error("❌ Failed to create user profile:", createError);
      } else {
        console.log("✅ User profile created successfully");
      }
    } else if (existingUser) {
      console.log("✅ User profile already exists");
    }
  } catch (error) {
    console.error("❌ Error ensuring user profile:", error);
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string
): Promise<AuthResult> {
  try {
    console.log("🔍 Sending magic link to:", email);

    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      console.error("❌ Magic link send failed:", error);
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

    await goto(redirectUrl, { replaceState: true });
  } catch (error) {
    console.error("❌ Sign out error:", error);
    // Still redirect even if sign out fails
    await goto("/auth/login", { replaceState: true });
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

/**
 * Redirect authenticated user to appropriate page
 */
export async function redirectAuthenticatedUser(): Promise<void> {
  try {
    console.log("🔍 Checking authentication status for redirect...");
    const session = await getCurrentSession();

    if (session) {
      console.log("✅ User is authenticated, redirecting to dashboard");
      console.log("🔍 Session user:", {
        id: session.user.id,
        email: session.user.email,
      });
      await goto("/dashboard", { replaceState: true });
    } else {
      console.log("❌ No session found, redirecting to login");
      await goto("/auth/login", { replaceState: true });
    }
  } catch (error) {
    console.error("❌ Redirect error:", error);
    // Fallback to login page
    await goto("/auth/login", { replaceState: true });
  }
}

/**
 * Redirect unauthenticated user to login
 */
export async function redirectUnauthenticatedUser(): Promise<void> {
  try {
    console.log("❌ User is not authenticated, redirecting to login");
    await goto("/auth/login", { replaceState: true });
  } catch (error) {
    console.error("❌ Redirect error:", error);
    // Fallback to login page
    window.location.href = "/auth/login";
  }
}
