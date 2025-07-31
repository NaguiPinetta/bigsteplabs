import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Checking lessons table structure...");

    // Check if order_index column exists by trying to select it
    const { data: lessons, error: selectError } = await supabase
      .from("lessons")
      .select("id, title, order_index, unit_id")
      .limit(1);

    if (selectError) {
      console.error("❌ Error selecting from lessons:", selectError);
      return json(
        {
          success: false,
          error: selectError.message,
          code: selectError.code,
          details: selectError.details,
        },
        { status: 500 }
      );
    }

    console.log("✅ Successfully selected from lessons table:", lessons);

    // Try to update a single lesson's order_index
    if (lessons && lessons.length > 0) {
      const lessonId = lessons[0].id;
      const currentOrderIndex = lessons[0].order_index;
      const newOrderIndex = currentOrderIndex + 100; // Use a large number to make it obvious

      console.log(
        `🔄 Trying to update lesson ${lessonId} from order_index ${currentOrderIndex} to ${newOrderIndex}`
      );

      const { data: updateResult, error: updateError } = await supabase
        .from("lessons")
        .update({ order_index: newOrderIndex })
        .eq("id", lessonId)
        .select("id, title, order_index");

      if (updateError) {
        console.error("❌ Error updating lesson:", updateError);
        return json(
          {
            success: false,
            error: updateError.message,
            code: updateError.code,
            details: updateError.details,
          },
          { status: 500 }
        );
      }

      console.log("✅ Update result:", updateResult);

      // Check if the update actually worked
      const { data: checkResult, error: checkError } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("id", lessonId)
        .single();

      if (checkError) {
        console.error("❌ Error checking update:", checkError);
        return json(
          { success: false, error: checkError.message },
          { status: 500 }
        );
      }

      console.log("✅ Check result:", checkResult);

      return json({
        success: true,
        message: "Lessons table structure check completed",
        originalLesson: lessons[0],
        updateResult: updateResult,
        checkResult: checkResult,
        updateWorked: checkResult.order_index === newOrderIndex,
      });
    }

    return json({
      success: true,
      message: "Lessons table accessible but no lessons found",
      lessons: lessons,
    });
  } catch (error) {
    console.error("❌ Error checking lessons table:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
