import { writable, derived, get } from "svelte/store";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type { User as AppUser } from "../types";

interface AuthState {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  session: null,
  user: null,
  loading: true,
  initialized: false,
};
export const authStore = writable<AuthState>(initialState);

let authInitialized = false;
let authListener: any = null;
let authUpdateTimeout: NodeJS.Timeout | null = null;

// Sign up using Supabase email/password
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };

  if (data.user) {
    await updateAuthState(data.session);
    return {
      success: true,
      message:
        "Account created successfully! Please check your email for verification.",
    };
  }

  return { success: false, error: "Failed to create account" };
}

// Sign in using Supabase email/password (for admin or regular users)
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  await updateAuthState(data.session);
  return { success: true };
}

// Remove the previous signInAsAdmin function entirely. Instead, after
// signing in, check the user's role to determine admin privileges:

async function updateAuthState(session: Session | null) {
  // Debounce rapid auth state updates to prevent loops
  if (authUpdateTimeout) {
    clearTimeout(authUpdateTimeout);
  }

  authUpdateTimeout = setTimeout(async () => {
    if (!session) {
      authStore.set({
        session: null,
        user: null,
        loading: false,
        initialized: true,
      });
      return;
    }

    try {
      // Try to fetch user profile, but handle missing tables gracefully
      let profile = null;
      let role = "Student"; // Default role

      try {
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && userProfile) {
          profile = userProfile;
          role = userProfile.role || "Student";
          console.log("✅ Existing user loaded successfully");
        } else if (error && error.code === "PGRST116") {
          // User doesn't exist, try to create profile
          console.log("🔄 User not found, attempting to create profile...");

          // Determine role based on email
          if (session.user.email === "jdpinetta@gmail.com") {
            role = "Admin";
          }

          try {
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

            if (!createError && newUser) {
              profile = newUser;
              console.log("✅ New user created successfully");
            } else {
              console.warn("⚠️ Could not create user profile:", createError);
            }
          } catch (createError) {
            console.warn(
              "⚠️ Users table not accessible, using session data only"
            );
          }
        } else {
          console.warn("⚠️ Error loading user profile:", error);
        }
      } catch (dbError) {
        console.warn("⚠️ Database not accessible, using session data only");
      }

      // Create a basic user object from session data if profile is not available
      if (!profile) {
        profile = {
          id: session.user.id,
          email: session.user.email || "",
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AppUser;
      }

      authStore.set({
        session,
        user: profile,
        loading: false,
        initialized: true,
      });

      console.log("✅ Auth state updated successfully");
    } catch (error) {
      console.error("❌ Error updating auth state:", error);
      // Fallback to basic session data
      authStore.set({
        session,
        user: {
          id: session.user.id,
          email: session.user.email || "",
          role: "Student",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AppUser,
        loading: false,
        initialized: true,
      });
    }
  }, 100); // 100ms debounce
}

// Note: Use signOut from src/lib/auth.ts instead
// This function is deprecated and will be removed
export async function signOut() {
  console.log(
    "⚠️ Using deprecated signOut from auth store. Use signOut from src/lib/auth.ts instead."
  );

  try {
    // Clear the auth store immediately
    authStore.set({
      session: null,
      user: null,
      loading: false,
      initialized: true,
    });

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Sign out error:", error);
    } else {
      console.log("✅ Signed out successfully");
    }
  } catch (error) {}
}

// Initialize auth state - only call once
export async function initAuth() {
  if (authInitialized) {
    return;
  }

  try {
    console.log("🔐 Initializing auth state...");
    // Set loading state
    authStore.update((state) => ({ ...state, loading: true }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await updateAuthState(session);

    // Set up auth listener only once
    if (!authListener) {
      authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log({
          hasSession: !!session,
          userId: session?.user?.id,
        });

        // Only process specific events to prevent loops
        if (event === "SIGNED_IN") {
          console.log("🔐 User signed in");
          await updateAuthState(session);
        } else if (event === "SIGNED_OUT") {
          console.log("🔐 User signed out");
          await updateAuthState(null);
        } else {
          console.log("🔐 Auth state change:", event);
        }
      });
    }

    authInitialized = true;
    console.log("✅ Auth state initialized successfully");
  } catch (error) {
    authStore.set({
      session: null,
      user: null,
      loading: false,
      initialized: true,
    });
  }
}

// Manual auth initialization - call this when you need auth state
export async function initializeAuthManually(): Promise<void> {
  if (authInitialized) {
    return;
  }

  try {
    console.log("🔐 Manually initializing auth state...");
    // Set loading state
    authStore.update((state) => ({ ...state, loading: true }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await updateAuthState(session);

    // Don't set up another listener - use the one from initAuth
    authInitialized = true;
    console.log("✅ Auth state manually initialized successfully");
  } catch (error) {
    authStore.set({
      session: null,
      user: null,
      loading: false,
      initialized: true,
    });
  }
}

// Helper functions
export function getCurrentUser(): AppUser | null {
  const state = get(authStore);
  return state.user;
}

export function getCurrentSession(): Session | null {
  const state = get(authStore);
  return state.session;
}

export function isAuthenticated(): boolean {
  const state = get(authStore);
  return !!state.session;
}

// Derived store for canManageContent to prevent reactive loops
export const canManageContent = derived(authStore, ($authStore) => {
  const user = $authStore.user;
  return user?.role === "Admin" || user?.role === "Collaborator";
});

// Role helpers
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

export function isStudent(): boolean {
  return hasRole("Student");
}

export function isInstructor(): boolean {
  return hasRole("Instructor");
}

export function isAdmin(): boolean {
  return hasRole("Admin");
}

export function isCollaborator(): boolean {
  return hasRole("Collaborator");
}

// Reset auth state (for testing/debugging)
export function resetAuth() {
  console.log("🔄 Resetting auth state...");
  // Clear the auth store
  authStore.set({
    session: null,
    user: null,
    loading: false,
    initialized: true,
  });

  // Reset the initialization flag
  authInitialized = false;

  // Clear any auth listener
  if (authListener) {
    authListener.data.subscription.unsubscribe();
    authListener = null;
  }

  console.log("✅ Auth state reset successfully");
}

// Make resetAuth available globally for debugging
if (typeof window !== "undefined") {
  (window as any).resetAuth = resetAuth;
}
