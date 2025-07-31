import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { lessonIds } = await request.json();

    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return json(
        { success: false, error: "Invalid lesson IDs provided" },
        { status: 400 }
      );
    }

    console.log("🔄 Reordering lessons via admin API:", lessonIds);

    // Call the reorder function using admin client
    const { error } = await supabaseAdmin.rpc("reorder_lessons", {
      p_lesson_ids: lessonIds,
    });

    if (error) {
      console.error("❌ Error reordering lessons:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("✅ Lessons reordered successfully via admin API");
    return json({ success: true, message: "Lessons reordered successfully" });
  } catch (error) {
    console.error("❌ Error in reorder lessons API:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
