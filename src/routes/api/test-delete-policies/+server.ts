import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Testing DELETE policies for chat sessions and agents...");

    // Test 1: Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      return json(
        { error: "Not authenticated", details: userError },
        { status: 401 }
      );
    }

    console.log("👤 Current user:", user?.id);

    // Test 2: Check if user has any chat sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("id, title, message_count")
      .eq("user_id", user?.id)
      .limit(3);

    if (sessionsError) {
      return json(
        { error: "Failed to load sessions", details: sessionsError },
        { status: 500 }
      );
    }

    // Test 3: Check if user has any agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, name, status")
      .limit(3);

    if (agentsError) {
      return json(
        { error: "Failed to load agents", details: agentsError },
        { status: 500 }
      );
    }

    console.log("📋 Found sessions:", sessions?.length || 0);
    console.log("🤖 Found agents:", agents?.length || 0);

    // Test 4: Try to delete a session if available
    let sessionDeleteResult = null;
    if (sessions && sessions.length > 0) {
      const sessionToDelete = sessions[0];
      console.log("🗑️ Attempting to delete session:", sessionToDelete.id);

      const { error: sessionDeleteError, count: sessionDeleted } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionToDelete.id)
        .select("count");

      sessionDeleteResult = {
        sessionId: sessionToDelete.id,
        error: sessionDeleteError,
        count: sessionDeleted,
        success: !sessionDeleteError,
      };

      console.log("💬 Session delete result:", sessionDeleteResult);
    }

    // Test 5: Try to delete an agent if available
    let agentDeleteResult = null;
    if (agents && agents.length > 0) {
      const agentToDelete = agents[0];
      console.log("🗑️ Attempting to delete agent:", agentToDelete.id);

      const { error: agentDeleteError, count: agentDeleted } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentToDelete.id)
        .select("count");

      agentDeleteResult = {
        agentId: agentToDelete.id,
        error: agentDeleteError,
        count: agentDeleted,
        success: !agentDeleteError,
      };

      console.log("🤖 Agent delete result:", agentDeleteResult);
    }

    return json({
      user: user?.id,
      sessions: sessions || [],
      agents: agents || [],
      sessionDelete: sessionDeleteResult,
      agentDelete: agentDeleteResult,
      summary: {
        sessionsAvailable: sessions && sessions.length > 0,
        agentsAvailable: agents && agents.length > 0,
        sessionDeleteSuccess: sessionDeleteResult?.success || false,
        agentDeleteSuccess: agentDeleteResult?.success || false,
      },
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
    return json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}; 