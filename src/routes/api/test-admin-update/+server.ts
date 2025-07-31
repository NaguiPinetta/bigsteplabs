import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing admin manual update...");

    // Get a lesson with admin client
    const { data: lessons, error: selectError } = await supabaseAdmin
      .from("lessons")
      .select("id, title, order_index")
      .limit(1);

    if (selectError) {
      console.error("❌ Error selecting from lessons with admin:", selectError);
      return json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (!lessons || lessons.length === 0) {
      return json({ success: false, error: "No lessons found" }, { status: 400 });
    }

    const lesson = lessons[0];
    console.log("📋 Original lesson:", lesson);

    // Try to update order_index with admin client
    const newOrderIndex = lesson.order_index + 1000;
    console.log(`🔄 Trying to update lesson ${lesson.id} from order_index ${lesson.order_index} to ${newOrderIndex}`);

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from("lessons")
      .update({ order_index: newOrderIndex })
      .eq("id", lesson.id)
      .select("id, title, order_index");

    if (updateError) {
      console.error("❌ Error updating lesson with admin:", updateError);
      return json({ 
        success: false, 
        error: updateError.message,
        code: updateError.code,
        details: updateError.details
      }, { status: 500 });
    }

    console.log("✅ Update result with admin:", updateResult);

    // Check if the update actually worked
    const { data: checkResult, error: checkError } = await supabaseAdmin
      .from("lessons")
      .select("id, title, order_index")
      .eq("id", lesson.id)
      .single();

    if (checkError) {
      console.error("❌ Error checking update with admin:", checkError);
      return json({ success: false, error: checkError.message }, { status: 500 });
    }

    console.log("✅ Check result with admin:", checkResult);

    return json({
      success: true,
      message: "Admin manual update test completed",
      originalLesson: lesson,
      updateResult: updateResult,
      checkResult: checkResult,
      updateWorked: checkResult.order_index === newOrderIndex
    });

  } catch (error) {
    console.error("❌ Error in admin manual update test:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 