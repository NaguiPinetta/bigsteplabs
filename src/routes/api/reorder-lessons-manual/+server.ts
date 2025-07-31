import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { lessonIds } = await request.json();

    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return json({ success: false, error: "Invalid lesson IDs provided" }, { status: 400 });
    }

    console.log("🔄 Manually reordering lessons:", lessonIds);

    // Update each lesson's order_index manually
    for (let i = 0; i < lessonIds.length; i++) {
      const lessonId = lessonIds[i];
      const newOrderIndex = i;

      const { error } = await supabaseAdmin
        .from("lessons")
        .update({ order_index: newOrderIndex })
        .eq("id", lessonId);

      if (error) {
        console.error(`❌ Error updating lesson ${lessonId}:`, error);
        return json({ success: false, error: error.message }, { status: 500 });
      }

      console.log(`✅ Updated lesson ${lessonId} to order_index ${newOrderIndex}`);
    }

    console.log("✅ All lessons reordered successfully");

    // Fetch the updated lessons to confirm
    const { data: lessons, error: fetchError } = await supabaseAdmin
      .from("lessons")
      .select("id, title, order_index")
      .in("id", lessonIds)
      .order("order_index", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching updated lessons:", fetchError);
      return json({ success: false, error: fetchError.message }, { status: 500 });
    }

    return json({
      success: true,
      message: "Lessons reordered successfully",
      updatedLessons: lessons
    });

  } catch (error) {
    console.error("❌ Error in manual reorder lessons API:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 