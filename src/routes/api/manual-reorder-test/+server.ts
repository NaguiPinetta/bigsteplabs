import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing manual order_index update...");

    // Get some lessons
    const { data: lessons, error: fetchError } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .order("order_index", { ascending: true })
      .limit(4);

    if (fetchError) {
      console.error("❌ Error fetching lessons:", fetchError);
      return json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!lessons || lessons.length < 2) {
      return json(
        { success: false, error: "Need at least 2 lessons to test" },
        { status: 400 }
      );
    }

    console.log("📋 Original lessons:", lessons);

    // Manually update the order_index values in reverse order
    const updates = lessons.map((lesson, index) => ({
      id: lesson.id,
      order_index: lessons.length - 1 - index, // Reverse the order
    }));

    console.log("🔄 Updating with:", updates);

    // Update each lesson individually
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("lessons")
        .update({ order_index: update.order_index })
        .eq("id", update.id);

      if (updateError) {
        console.error("❌ Error updating lesson:", update.id, updateError);
        return json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    }

    // Fetch lessons again to see the changes
    const { data: lessonsAfter, error: fetchAfterError } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .in(
        "id",
        lessons.map((l) => l.id)
      )
      .order("order_index", { ascending: true });

    if (fetchAfterError) {
      console.error("❌ Error fetching lessons after update:", fetchAfterError);
      return json(
        { success: false, error: fetchAfterError.message },
        { status: 500 }
      );
    }

    console.log("📋 Lessons after manual update:", lessonsAfter);

    return json({
      success: true,
      message: "Manual order_index update completed",
      originalOrder: lessons,
      newOrder: lessonsAfter,
    });
  } catch (error) {
    console.error("❌ Error in manual reorder test:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
