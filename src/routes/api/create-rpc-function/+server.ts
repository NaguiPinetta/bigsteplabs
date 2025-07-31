import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async () => {
  try {
    console.log("🔧 Creating reorder_lessons RPC function...");

    // Create the function using raw SQL
    const { error: createError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE OR REPLACE FUNCTION reorder_lessons(p_lesson_ids UUID[])
        RETURNS VOID AS $$
        DECLARE
          lesson_id UUID;
          new_order INTEGER := 0;
        BEGIN
          -- Update order_index for each lesson in the provided order
          FOREACH lesson_id IN ARRAY p_lesson_ids
          LOOP
            UPDATE lessons 
            SET order_index = new_order
            WHERE id = lesson_id;
            
            new_order := new_order + 1;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (createError) {
      console.error("❌ Error creating function:", createError);
      return json({ success: false, error: createError.message }, { status: 500 });
    }

    // Grant execute permissions
    const { error: grantError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `GRANT EXECUTE ON FUNCTION reorder_lessons(UUID[]) TO authenticated;`
    });

    if (grantError) {
      console.error("❌ Error granting permissions:", grantError);
      return json({ success: false, error: grantError.message }, { status: 500 });
    }

    console.log("✅ RPC function created successfully");

    // Test the function
    const testLessonIds = [
      "af28ed05-a8a5-4455-9453-f9c215f9e13d",
      "a4caf5d6-736a-400e-81ea-955a87d47f42"
    ];

    console.log("🧪 Testing the function with:", testLessonIds);

    const { error: testError } = await supabaseAdmin.rpc("reorder_lessons", {
      p_lesson_ids: testLessonIds,
    });

    if (testError) {
      console.error("❌ Error testing function:", testError);
      return json({ success: false, error: testError.message }, { status: 500 });
    }

    // Check if the order changed
    const { data: lessons, error: checkError } = await supabaseAdmin
      .from("lessons")
      .select("id, title, order_index")
      .in("id", testLessonIds)
      .order("order_index", { ascending: true });

    if (checkError) {
      console.error("❌ Error checking results:", checkError);
      return json({ success: false, error: checkError.message }, { status: 500 });
    }

    console.log("📋 Lessons after function test:", lessons);

    return json({
      success: true,
      message: "RPC function created and tested successfully",
      testResults: lessons
    });

  } catch (error) {
    console.error("❌ Error creating RPC function:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 