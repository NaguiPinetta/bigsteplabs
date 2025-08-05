import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, role } = await request.json();

    // Validate input
    if (!email || !role) {
      return new Response(
        JSON.stringify({
          error: "Email and role are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate role
    const validRoles = ["Admin", "Collaborator", "Student"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role. Must be Admin, Collaborator, or Student",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }



    // Create auth user without password (magic link only)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      user_metadata: { role },
      email_confirm: false, // No email confirmation required
    });

    if (error) {
      console.error("❌ Failed to create auth user:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Failed to create user - no user ID returned",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create user profile in users table
    const userProfile = await supabaseAdmin
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

    if (userProfile.error) {
      console.error("❌ Failed to create user profile:", userProfile.error);
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          error: "Failed to create user profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }



    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile.data,
        message:
          "User created successfully. They can sign in using magic link.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in create-user-magic-link:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
