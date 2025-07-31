import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing lesson table updates...");

    // Get a lesson
    const { data: lessons, error: selectError } = await supabase
      .from("lessons")
      .select("id, title, order_index, is_published")
      .limit(1);

    if (selectError) {
      console.error("❌ Error selecting from lessons:", selectError);
      return json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (!lessons || lessons.length === 0) {
      return json({ success: false, error: "No lessons found" }, { status: 400 });
    }

    const lesson = lessons[0];
    console.log("📋 Original lesson:", lesson);

    // Test 1: Try to update is_published
    const { data: updatePublishedResult, error: updatePublishedError } = await supabase
      .from("lessons")
      .update({ is_published: !lesson.is_published })
      .eq("id", lesson.id)
      .select("id, title, is_published");

    console.log("📋 Update is_published result:", updatePublishedResult);
    console.log("📋 Update is_published error:", updatePublishedError);

    // Test 2: Try to update title
    const { data: updateTitleResult, error: updateTitleError } = await supabase
      .from("lessons")
      .update({ title: lesson.title + " (TEST)" })
      .eq("id", lesson.id)
      .select("id, title");

    console.log("📋 Update title result:", updateTitleResult);
    console.log("📋 Update title error:", updateTitleError);

    // Test 3: Try to update order_index
    const { data: updateOrderResult, error: updateOrderError } = await supabase
      .from("lessons")
      .update({ order_index: lesson.order_index + 1000 })
      .eq("id", lesson.id)
      .select("id, title, order_index");

    console.log("📋 Update order_index result:", updateOrderResult);
    console.log("📋 Update order_index error:", updateOrderError);

    // Check final state
    const { data: finalLesson, error: finalError } = await supabase
      .from("lessons")
      .select("id, title, order_index, is_published")
      .eq("id", lesson.id)
      .single();

    console.log("📋 Final lesson state:", finalLesson);

    return json({
      success: true,
      message: "Lesson update tests completed",
      originalLesson: lesson,
      updatePublishedResult: updatePublishedResult,
      updatePublishedError: updatePublishedError,
      updateTitleResult: updateTitleResult,
      updateTitleError: updateTitleError,
      updateOrderResult: updateOrderResult,
      updateOrderError: updateOrderError,
      finalLesson: finalLesson
    });

  } catch (error) {
    console.error("❌ Error in lesson update test:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 