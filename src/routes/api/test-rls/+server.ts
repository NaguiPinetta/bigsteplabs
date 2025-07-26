import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Testing RLS policies with service role key...");

    // Test 1: Try to read users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .limit(5);

    console.log("Users query result:", { users, error: usersError });

    // Test 2: Try to insert a test user
    const testUserId = "00000000-0000-0000-0000-000000000000";
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: testUserId,
        email: "test@example.com",
        role: "Student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    console.log("Insert test result:", { insertData, error: insertError });

    // Test 3: Try to delete the test user
    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", testUserId);

    console.log("Delete test result:", { error: deleteError });

    // Test 4: Check if we can create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "test-auth@example.com",
        password: "testpassword123",
        user_metadata: { role: "Student" },
        email_confirm: true,
      });

    console.log("Auth user creation result:", { authData, error: authError });

    // Clean up test auth user if created
    if (authData?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tests: {
          usersQuery: { success: !usersError, error: usersError?.message },
          insertTest: { success: !insertError, error: insertError?.message },
          deleteTest: { success: !deleteError, error: deleteError?.message },
          authUserCreation: { success: !authError, error: authError?.message },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in RLS test:", error);
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
