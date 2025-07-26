import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Testing auth user creation...");

    // Test 1: Try to create a simple auth user (no email confirmation)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: "testpassword123",
      email_confirm: false, // No email confirmation required
    });

    console.log("Auth user creation result:", { data, error });

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

    // Clean up the test user
    if (data.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      console.log("✅ Test user cleaned up");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auth user creation works!",
        userId: data.user?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in auth test:", error);
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
