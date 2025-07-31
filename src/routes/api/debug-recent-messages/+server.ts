import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const GET: RequestHandler = async () => {
  try {
    console.log("🔍 Debugging recent messages...");

    // Get recent messages with metadata
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error("❌ Error fetching messages:", messagesError);
      return json({ error: "Failed to fetch messages", details: messagesError }, { status: 500 });
    }

    console.log("✅ Fetched messages:", messages?.length || 0);

    // Analyze all messages
    const analyzedMessages = messages?.map(msg => ({
      id: msg.id,
      content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
      role: msg.role,
      metadata: msg.metadata,
      hasMetadata: !!msg.metadata,
      hasAudioUrl: !!msg.metadata?.audio_url,
      isVoiceMessage: !!msg.metadata?.is_voice_message,
      created_at: msg.created_at,
      session_id: msg.session_id
    })) || [];

    // Count by role
    const roleCounts = analyzedMessages.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count messages with metadata
    const messagesWithMetadata = analyzedMessages.filter(msg => msg.hasMetadata);
    const messagesWithAudio = analyzedMessages.filter(msg => msg.hasAudioUrl);

    return json({
      success: true,
      totalMessages: messages?.length || 0,
      roleCounts,
      messagesWithMetadata: messagesWithMetadata.length,
      messagesWithAudio: messagesWithAudio.length,
      allMessages: analyzedMessages,
      messagesWithAudioDetails: messagesWithAudio
    });

  } catch (error) {
    console.error("❌ Debug error:", error);
    return json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 