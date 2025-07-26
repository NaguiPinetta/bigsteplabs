import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Testing magic link user creation...");

    const testEmail = `test-${Date.now()}@gmail.com`;

    console.log("📝 Test data:", { email: testEmail });

    // Create auth user without password (magic link only)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      user_metadata: { role: "Student" },
      email_confirm: false, // No email confirmation required
    });

    console.log("🔐 Magic link creation result:", {
      success: !error,
      userId: data?.user?.id,
      error: error?.message,
      errorCode: error?.status,
      fullError: error,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.status,
          details: error,
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
          success: false,
          error: "No user ID returned from auth creation",
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
        email: testEmail,
        role: "Student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userProfile.error) {
      console.error("❌ Failed to create user profile:", userProfile.error);
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create user profile",
          details: userProfile.error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success! Clean up test user
    console.log("✅ Magic link user creation successful! Cleaning up...");
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Magic link user creation works!",
        testUserId: userId,
        userProfile: userProfile.data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Unexpected error in magic link test:", error);
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