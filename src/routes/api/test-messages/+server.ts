import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing messages with audio URLs...");

    // Get recent messages with metadata
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesError) {
      console.error("❌ Error fetching messages:", messagesError);
      return json({ error: "Failed to fetch messages", details: messagesError }, { status: 500 });
    }

    console.log("✅ Fetched messages:", messages?.length || 0);

    // Filter messages with audio URLs
    const messagesWithAudio = messages?.filter(msg => 
      msg.metadata && 
      (msg.metadata.audio_url || msg.metadata.is_voice_message)
    ) || [];

    console.log("🎵 Messages with audio metadata:", messagesWithAudio.length);

    // Log details of messages with audio
    messagesWithAudio.forEach((msg, index) => {
      console.log(`🎵 Message ${index + 1}:`, {
        id: msg.id,
        content: msg.content,
        metadata: msg.metadata,
        hasAudioUrl: !!msg.metadata?.audio_url,
        isVoiceMessage: !!msg.metadata?.is_voice_message
      });
    });

    return json({
      success: true,
      totalMessages: messages?.length || 0,
      messagesWithAudio: messagesWithAudio.length,
      audioMessages: messagesWithAudio.map(msg => ({
        id: msg.id,
        content: msg.content,
        metadata: msg.metadata,
        created_at: msg.created_at
      }))
    });

  } catch (error) {
    console.error("❌ Test error:", error);
    return json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 