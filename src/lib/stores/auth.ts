import { writable, derived } from "svelte/store";
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
  console.log("🔄 Updating auth state:", {
    hasSession: !!session,
    userId: session?.user?.id,
  });

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
    // Fetch the corresponding profile from your users table
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // User doesn't exist, create profile
      console.log("🔍 Creating new user profile for:", session.user.email);

      // Determine role based on email
      let role = "Student"; // Default role
      if (session.user.email === "jdpinetta@gmail.com") {
        role = "Admin";
        console.log("🔍 Setting admin role for:", session.user.email);
      }

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
        console.error("❌ Failed to create user profile:", createError);
        authStore.set({
          session,
          user: null,
          loading: false,
          initialized: true,
        });
      } else {
        console.log("✅ User profile created successfully:", newUser);
        authStore.set({
          session,
          user: newUser as AppUser,
          loading: false,
          initialized: true,
        });
      }
    } else if (error) {
      console.error("❌ Failed to fetch user profile:", error);
      authStore.set({ session, user: null, loading: false, initialized: true });
    } else {
      console.log("✅ User profile found:", profile);
      authStore.set({
        session,
        user: profile as AppUser,
        loading: false,
        initialized: true,
      });
    }
  } catch (error) {
    console.error("❌ Error in updateAuthState:", error);
    authStore.set({ session, user: null, loading: false, initialized: true });
  }
}

export async function signOut() {
  try {
    console.log("🔍 Auth store: Signing out...");

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
      console.error("❌ Auth store: Supabase sign out error:", error);
    } else {
      console.log("✅ Auth store: Sign out successful");
    }
  } catch (error) {
    console.error("❌ Auth store: Sign out error:", error);
  }
}

// Initialize auth state - only call once
export async function initAuth() {
  if (authInitialized) {
    console.log("Auth already initialized, skipping...");
    return;
  }

  try {
    console.log("🔄 Initializing auth...");

    // Set loading state
    authStore.update((state) => ({ ...state, loading: true }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await updateAuthState(session);

    // Set up auth listener only once
    if (!authListener) {
      authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔄 Auth state changed:", event);
        await updateAuthState(session);
      });
    }

    authInitialized = true;
    console.log("✅ Auth initialization complete");
  } catch (error) {
    console.error("❌ Auth initialization failed:", error);
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
  let user: AppUser | null = null;
  authStore.subscribe((state) => {
    user = state.user;
  })();
  return user;
}

export function getCurrentSession(): Session | null {
  let session: Session | null = null;
  authStore.subscribe((state) => {
    session = state.session;
  })();
  return session;
}

export function isAuthenticated(): boolean {
  let session: Session | null = null;
  authStore.subscribe((state) => {
    session = state.session;
  })();
  return !!session;
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
  authStore.set(initialState);
  authInitialized = false;
  if (authListener) {
    authListener.data.subscription.unsubscribe();
    authListener = null;
  }
}
