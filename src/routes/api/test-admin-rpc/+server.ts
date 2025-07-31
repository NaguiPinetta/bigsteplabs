import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing admin RPC function...");

    // Test with a simple array of lesson IDs
    const testLessonIds = [
      "af28ed05-a8a5-4455-9453-f9c215f9e13d",
      "a4caf5d6-736a-400e-81ea-955a87d47f42",
    ];

    console.log("🔄 Calling reorder_lessons with admin client:", testLessonIds);

    // Call the reorder function with admin client
    const { data, error } = await supabaseAdmin.rpc("reorder_lessons", {
      p_lesson_ids: testLessonIds,
    });

    if (error) {
      console.error("❌ Error calling reorder_lessons with admin:", error);
      return json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log("✅ Admin RPC function called successfully, data:", data);

    // Check the current order_index values with admin client
    const { data: lessons, error: fetchError } = await supabaseAdmin
      .from("lessons")
      .select("id, title, order_index")
      .in("id", testLessonIds)
      .order("order_index", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching lessons with admin:", fetchError);
      return json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    console.log("📋 Lessons after admin RPC call:", lessons);

    return json({
      success: true,
      message: "Admin RPC function test completed",
      rpcResult: data,
      lessonsAfterCall: lessons,
    });
  } catch (error) {
    console.error("❌ Error testing admin RPC function:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
