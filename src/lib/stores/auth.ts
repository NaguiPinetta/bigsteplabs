import { writable } from "svelte/store";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type { User as AppUser } from "../types";

interface AuthState {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
}

const initialState: AuthState = { session: null, user: null, loading: true };
export const authStore = writable<AuthState>(initialState);

let authInitialized = false;

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

// Sign in via magic link (already available in src/lib/auth.ts)
// The login page can call sendMagicLink() for non-password flows

// Remove the previous signInAsAdmin function entirely. Instead, after
// signing in, check the user's role to determine admin privileges:

async function updateAuthState(session: Session | null) {
  if (!session) {
    authStore.set({ session: null, user: null, loading: false });
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
        authStore.set({ session, user: null, loading: false });
      } else {
        console.log("✅ User profile created successfully:", newUser);
        authStore.set({ session, user: newUser as AppUser, loading: false });
      }
    } else if (error) {
      console.error("❌ Failed to fetch user profile:", error);
      authStore.set({ session, user: null, loading: false });
    } else {
      console.log("✅ User profile found:", profile);
      authStore.set({ session, user: profile as AppUser, loading: false });
    }
  } catch (error) {
    console.error("❌ Error in updateAuthState:", error);
    authStore.set({ session, user: null, loading: false });
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  authStore.set({ session: null, user: null, loading: false });
}

// Initialize auth state
export async function initAuth() {
  if (authInitialized) {
    console.log("Auth already initialized, skipping...");
    return;
  }

  try {
    console.log("Initializing auth...");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await updateAuthState(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      await updateAuthState(session);
    });

    authInitialized = true;
    console.log("Auth initialization complete");
  } catch (error) {
    console.error("Auth initialization failed:", error);
    authStore.set({ session: null, user: null, loading: false });
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

export function canManageContent(): boolean {
  const user = getCurrentUser();
  return user?.role === "Admin" || user?.role === "Collaborator";
}

// Reset auth state (for testing/debugging)
export function resetAuth() {
  authStore.set(initialState);
}
