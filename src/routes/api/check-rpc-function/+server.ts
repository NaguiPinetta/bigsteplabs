import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Checking RPC function...");

    // Check if the function exists by querying the information schema
    const { data: functionInfo, error: functionError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'reorder_lessons')
      .eq('routine_schema', 'public');

    if (functionError) {
      console.error("❌ Error checking function:", functionError);
      return json({ success: false, error: functionError.message }, { status: 500 });
    }

    console.log("📋 Function info:", functionInfo);

    // Also check if we can call the function with a simple test
    const testLessonIds = [
      "af28ed05-a8a5-4455-9453-f9c215f9e13d",
      "a4caf5d6-736a-400e-81ea-955a87d47f42"
    ];

    console.log("🔄 Testing function call with:", testLessonIds);

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("reorder_lessons", {
      p_lesson_ids: testLessonIds,
    });

    console.log("📋 RPC result:", rpcResult);
    console.log("📋 RPC error:", rpcError);

    return json({
      success: true,
      message: "RPC function check completed",
      functionExists: functionInfo && functionInfo.length > 0,
      functionInfo: functionInfo,
      rpcResult: rpcResult,
      rpcError: rpcError
    });

  } catch (error) {
    console.error("❌ Error checking RPC function:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 