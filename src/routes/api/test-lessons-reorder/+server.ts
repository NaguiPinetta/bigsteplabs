import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing lessons reorder function...");

    // First, get some lessons to test with
    const { data: lessons, error: fetchError } = await supabase
      .from("lessons")
      .select("id, title, order_index, unit_id")
      .order("order_index", { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error("❌ Error fetching lessons:", fetchError);
      return json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!lessons || lessons.length < 2) {
      return json({ success: false, error: "Need at least 2 lessons to test reordering" }, { status: 400 });
    }

    console.log("📋 Original lessons order:", lessons.map(l => ({ id: l.id, title: l.title, order_index: l.order_index, unit_id: l.unit_id })));

    // Get lesson IDs in reverse order for testing
    const lessonIds = lessons.map(l => l.id).reverse();
    console.log("🔄 Testing reorder with IDs:", lessonIds);

    // Call the reorder function
    const { error: reorderError } = await supabase.rpc("reorder_lessons", {
      p_lesson_ids: lessonIds,
    });

    if (reorderError) {
      console.error("❌ Error calling reorder_lessons:", reorderError);
      return json({ success: false, error: reorderError.message }, { status: 500 });
    }

    // Fetch lessons again to see if order changed
    const { data: lessonsAfter, error: fetchAfterError } = await supabase
      .from("lessons")
      .select("id, title, order_index, unit_id")
      .in("id", lessonIds)
      .order("order_index", { ascending: true });

    if (fetchAfterError) {
      console.error("❌ Error fetching lessons after reorder:", fetchAfterError);
      return json({ success: false, error: fetchAfterError.message }, { status: 500 });
    }

    console.log("📋 Lessons after reorder:", lessonsAfter?.map(l => ({ id: l.id, title: l.title, order_index: l.order_index, unit_id: l.unit_id })));

    return json({
      success: true,
      message: "Lessons reorder test completed",
      originalOrder: lessons.map(l => ({ id: l.id, title: l.title, order_index: l.order_index, unit_id: l.unit_id })),
      newOrder: lessonsAfter?.map(l => ({ id: l.id, title: l.title, order_index: l.order_index, unit_id: l.unit_id }))
    });

  } catch (error) {
    console.error("❌ Error testing lessons reorder:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 