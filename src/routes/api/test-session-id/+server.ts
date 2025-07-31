import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const agentId = formData.get('agentId') as string;

    console.log("🧪 Testing sessionId:", sessionId);
    console.log("🧪 Testing agentId:", agentId);

    // Check if sessionId exists in the database
    let sessionExists = false;
    if (sessionId && sessionId !== "default") {
      const { data: session, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, user_id, agent_id, status')
        .eq('id', sessionId)
        .single();

      if (!error && session) {
        sessionExists = true;
        console.log("✅ Session found:", session);
      } else {
        console.log("❌ Session not found:", error);
      }
    }

    // Check if agentId exists
    let agentExists = false;
    if (agentId) {
      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .select('id, name, whisper_language')
        .eq('id', agentId)
        .single();

      if (!error && agent) {
        agentExists = true;
        console.log("✅ Agent found:", agent);
      } else {
        console.log("❌ Agent not found:", error);
      }
    }

    return json({
      success: true,
      sessionId,
      agentId,
      sessionExists,
      agentExists,
      sessionIdValid: sessionId && sessionId !== "default",
      agentIdValid: !!agentId
    });

  } catch (error) {
    console.error("❌ Test error:", error);
    return json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 