import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Checking existing users...");

    // Get all users from the users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return new Response(
        JSON.stringify({
          success: false,
          error: usersError.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get auth users (this might not work due to RLS, but worth trying)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    return new Response(
      JSON.stringify({
        success: true,
        users: users || [],
        authUsers: authUsers?.users || [],
        authError: authError?.message || null,
        userCount: users?.length || 0,
        authUserCount: authUsers?.users?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in debug-users:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 