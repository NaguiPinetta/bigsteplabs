import { writable } from "svelte/store";
import type { User, Session } from "@supabase/supabase-js";
import type { User as AppUser } from "../types";
import { supabase } from "../supabase";

interface AuthState {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
}

const initialState: AuthState = {
  session: null,
  user: null,
  loading: true,
};

export const authStore = writable<AuthState>(initialState);

// Track if initialization is in progress to prevent multiple calls
let initializingAuth = false;
// Track if we're manually setting a session to prevent conflicts
let manuallySettingSession = false;

// Function to manually set session (used by auth utility)
export const setSessionManually = (
  session: Session | null,
  user: AppUser | null
) => {
  manuallySettingSession = true;
  authStore.set({ session, user, loading: false });
  // Reset flag after a short delay
  setTimeout(() => {
    manuallySettingSession = false;
  }, 1000);
};

// Simple admin login function
export const signInAsAdmin = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check hardcoded admin credentials
    if (username === "admin" && password === "B1g573p1d10m45") {
      const mockUser: AppUser = {
        id: "admin-mock-id",
        email: "admin@bigsteplabs.com",
        role: "Admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: "mock-admin-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: mockUser.id,
          email: mockUser.email || "",
        },
      } as any;

      // Store in localStorage for persistence
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "bigstep_auth_session",
          JSON.stringify(mockSession)
        );
        localStorage.setItem("bigstep_auth_user", JSON.stringify(mockUser));
      }

      // Set auth state
      authStore.set({
        session: mockSession,
        user: mockUser,
        loading: false,
      });

      return { success: true };
    } else {
      return { success: false, error: "Invalid username or password" };
    }
  } catch (error) {
    return { success: false, error: "Authentication failed" };
  }
};

// Initialize auth state
export const initAuth = async () => {
  if (initializingAuth || manuallySettingSession) {
    console.log(
      "Auth initialization already in progress or session being set manually"
    );
    return;
  }

  initializingAuth = true;

  try {
    console.log("Starting auth initialization");

    // First check for localStorage session (for simple admin login)
    if (typeof localStorage !== "undefined") {
      const storedSession = localStorage.getItem("bigstep_auth_session");
      const storedUser = localStorage.getItem("bigstep_auth_user");

      if (storedSession && storedUser) {
        try {
          const session = JSON.parse(storedSession);
          const user = JSON.parse(storedUser);

          authStore.set({
            session,
            user,
            loading: false,
          });

          initializingAuth = false;
          return;
        } catch (e) {
          // Clear invalid stored data
          localStorage.removeItem("bigstep_auth_session");
          localStorage.removeItem("bigstep_auth_user");
        }
      }
    }

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Auth initialization timeout - setting loading to false");
      authStore.set({ session: null, user: null, loading: false });
      initializingAuth = false;
    }, 10000); // 10 second timeout

    const {
      data: { session },
    } = await supabase.auth.getSession();

    clearTimeout(timeoutId);
    console.log("Supabase getSession result:", { hasSession: !!session });

    if (session) {
      await updateAuthState(session);
    } else {
      console.log("No session found, setting auth state");
      authStore.set({ session: null, user: null, loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, { hasSession: !!session });
      if (session) {
        await updateAuthState(session);
      } else {
        authStore.set({ session: null, user: null, loading: false });
      }
    });
  } catch (error) {
    console.error("Auth initialization error:", error);
    authStore.set({ session: null, user: null, loading: false });
  } finally {
    initializingAuth = false;
  }
};

async function updateAuthState(session: Session) {
  try {
    // Get user profile from our users table
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      // If user doesn't exist in users table, create one
      if (error.code === "PGRST116") {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email || "",
            role: "Student", // Default role
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating user profile:", createError);
          authStore.set({ session, user: null, loading: false });
          return;
        }

        authStore.set({ session, user: newUser, loading: false });
      } else {
        authStore.set({ session, user: null, loading: false });
      }
    } else {
      authStore.set({ session, user: userProfile, loading: false });
    }
  } catch (err) {
    console.error("Auth state update error:", err);
    authStore.set({ session, user: null, loading: false });
  }
}

export const signOut = async () => {
  // Clear localStorage
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("bigstep_auth_session");
    localStorage.removeItem("bigstep_auth_user");
  }

  // Sign out from Supabase
  await supabase.auth.signOut();
  authStore.set({ session: null, user: null, loading: false });
};

// Force reset auth state (for clearing stuck sessions)
export const resetAuth = () => {
  initializingAuth = false;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("bigstep_auth_session");
    localStorage.removeItem("bigstep_auth_user");
  }
  authStore.set({ session: null, user: null, loading: false });
};

// Helper functions for role checking
export const isAdmin = (user: AppUser | null): boolean =>
  user?.role === "Admin";
export const isCollaborator = (user: AppUser | null): boolean =>
  user?.role === "Collaborator";
export const isStudent = (user: AppUser | null): boolean =>
  user?.role === "Student";
export const canManageContent = (user: AppUser | null): boolean =>
  user?.role === "Admin" || user?.role === "Collaborator";
