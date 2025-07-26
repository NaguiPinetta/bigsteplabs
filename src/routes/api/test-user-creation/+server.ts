import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Testing user creation with detailed logging...");

    // Try with a different email domain
    const testEmail = `test-${Date.now()}@gmail.com`;
    const testPassword = "testpassword123";

    console.log("📝 Test data:", { email: testEmail, password: testPassword });

    // Step 1: Test auth user creation
    console.log("🔐 Step 1: Creating auth user...");
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: { role: "Student" },
        email_confirm: false,
      });

    console.log("🔐 Auth creation result:", {
      success: !authError,
      userId: authData?.user?.id,
      error: authError?.message,
      errorCode: authError?.status,
      fullError: authError,
    });

    if (authError) {
      return new Response(
        JSON.stringify({
          success: false,
          step: "auth_creation",
          error: authError.message,
          code: authError.status,
          details: authError,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          step: "auth_creation",
          error: "No user ID returned from auth creation",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Test user profile creation
    console.log("👤 Step 2: Creating user profile...");
    const { data: profileData, error: profileError } = await supabaseAdmin
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

    console.log("👤 Profile creation result:", {
      success: !profileError,
      profileId: profileData?.id,
      error: profileError?.message,
      errorCode: profileError?.code,
      fullError: profileError,
    });

    if (profileError) {
      // Clean up auth user if profile creation fails
      console.log(
        "🧹 Cleaning up auth user due to profile creation failure..."
      );
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({
          success: false,
          step: "profile_creation",
          error: profileError.message,
          code: profileError.code,
          details: profileError,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Test user_credentials creation
    console.log("🔑 Step 3: Creating user credentials...");
    const { data: credentialsData, error: credentialsError } =
      await supabaseAdmin
        .from("user_credentials")
        .insert({
          user_id: userId,
          username: testEmail,
          password_hash: "test_hash_placeholder", // In real implementation, this would be hashed
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    console.log("🔑 Credentials creation result:", {
      success: !credentialsError,
      credentialsId: credentialsData?.id,
      error: credentialsError?.message,
      errorCode: credentialsError?.code,
      fullError: credentialsError,
    });

    if (credentialsError) {
      // Clean up if credentials creation fails
      console.log("🧹 Cleaning up due to credentials creation failure...");
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({
          success: false,
          step: "credentials_creation",
          error: credentialsError.message,
          code: credentialsError.code,
          details: credentialsError,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success! Clean up test user
    console.log("✅ All steps successful! Cleaning up test user...");
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User creation test successful!",
        steps: {
          auth_creation: "✅",
          profile_creation: "✅",
          credentials_creation: "✅",
        },
        testUserId: userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error in test:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        step: "unexpected_error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
