import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing RPC function existence...");

    // Test with a simple array of lesson IDs
    const testLessonIds = [
      "af28ed05-a8a5-4455-9453-f9c215f9e13d",
      "a4caf5d6-736a-400e-81ea-955a87d47f42",
    ];

    console.log("🔄 Calling reorder_lessons with:", testLessonIds);

    // Call the reorder function
    const { data, error } = await supabase.rpc("reorder_lessons", {
      p_lesson_ids: testLessonIds,
    });

    if (error) {
      console.error("❌ Error calling reorder_lessons:", error);
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

    console.log("✅ RPC function called successfully, data:", data);

    // Check the current order_index values
    const { data: lessons, error: fetchError } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .in("id", testLessonIds)
      .order("order_index", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching lessons:", fetchError);
      return json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: "RPC function exists and was called",
      rpcResult: data,
      lessonsAfterCall: lessons,
    });
  } catch (error) {
    console.error("❌ Error testing RPC function:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
