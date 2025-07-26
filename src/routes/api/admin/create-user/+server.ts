import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password, role } = await request.json();

    // Validate input
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({
          error: "Email, password, and role are required",
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

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters long",
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

    console.log("🔍 Creating user with password:", { email, role });

    // Create auth user with password (no email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
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

    console.log("✅ User created successfully:", { userId, email, role });

    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile.data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error in create-user API:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
