import { supabaseAdmin } from "$lib/server/supabase-admin";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// GET: Get user's current module assignments
export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user's current assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from("user_module_assignments")
      .select(`
        id,
        module_id,
        assigned_at,
        expires_at,
        is_active,
        modules (
          id,
          title,
          description,
          is_published
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (assignmentsError) {
      console.error("❌ Error fetching assignments:", assignmentsError);
      return json({ error: assignmentsError.message }, { status: 500 });
    }

    // Get all available modules
    const { data: allModules, error: modulesError } = await supabaseAdmin
      .from("modules")
      .select("id, title, description, is_published")
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("❌ Error fetching modules:", modulesError);
      return json({ error: modulesError.message }, { status: 500 });
    }

    return json({
      success: true,
      assignments: assignments || [],
      availableModules: allModules || [],
      assignedModuleIds: (assignments || []).map(a => a.module_id)
    });

  } catch (error) {
    console.error("❌ Error in GET user module assignments:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

// POST: Assign modules to user
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, moduleIds, assignedBy } = await request.json();

    if (!userId || !moduleIds || !Array.isArray(moduleIds)) {
      return json({ error: "User ID and module IDs array are required" }, { status: 400 });
    }



    // First, deactivate all current assignments for this user
    const { error: deactivateError } = await supabaseAdmin
      .from("user_module_assignments")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (deactivateError) {
      console.error("❌ Error deactivating assignments:", deactivateError);
      return json({ error: deactivateError.message }, { status: 500 });
    }

    // Create new assignments for selected modules
    const assignments = moduleIds.map(moduleId => ({
      user_id: userId,
      module_id: moduleId,
      assigned_by: assignedBy,
      is_active: true
    }));

    if (assignments.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_module_assignments")
        .upsert(assignments, { onConflict: "user_id,module_id" });

      if (insertError) {
        console.error("❌ Error creating assignments:", insertError);
        return json({ error: insertError.message }, { status: 500 });
      }
    }



    return json({
      success: true,
      message: `Successfully assigned ${moduleIds.length} modules to user`,
      assignedModules: moduleIds
    });

  } catch (error) {
    console.error("❌ Error in POST user module assignments:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}; 