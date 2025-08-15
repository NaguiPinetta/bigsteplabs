import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import type { Database } from "../types/database";

// Server-only Supabase admin client
if (!PUBLIC_SUPABASE_URL) throw new Error("PUBLIC_SUPABASE_URL is missing");
if (!SUPABASE_SERVICE_ROLE_KEY) {
  // Be explicit to speed debugging, but keep message generic (no secrets)
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing (server-side)");
}

export const supabaseAdmin = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// Helper functions for admin operations
export async function createUserProfile(
  userId: string,
  email: string,
  role: string = "Student"
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      id: userId,
      email,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create user profile:", error);
    throw error;
  }

  return data;
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }

  return data;
}
