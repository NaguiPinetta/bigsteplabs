import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const agentId = formData.get('agentId') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Please provide an audio file.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 25MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for OpenAI API key
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get agent's language configuration
    let whisperLanguage = 'en'; // Default to English
    if (agentId) {
      try {
        const { data: agent, error: agentError } = await supabaseAdmin
          .from('agents')
          .select('whisper_language')
          .eq('id', agentId)
          .single();
        
        if (!agentError && agent?.whisper_language && agent.whisper_language !== 'auto') {
          whisperLanguage = agent.whisper_language;
        }
      } catch (error) {
        console.warn('Could not fetch agent language config, using default:', error);
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare form data for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
    openaiFormData.append('model', 'whisper-1');
    
    // Only set language if not auto-detect
    if (whisperLanguage !== 'auto') {
      openaiFormData.append('language', whisperLanguage);
    }
    
    openaiFormData.append('response_format', 'json');

    console.log(`🎤 Transcribing audio with language: ${whisperLanguage}`);

    // Call OpenAI Whisper API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: openaiFormData
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI Whisper API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Transcription failed', 
        details: errorData.error?.message || 'Unknown error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transcriptionData = await openaiResponse.json();
    const transcribedText = transcriptionData.text;

    console.log('✅ Transcription successful:', transcribedText);

    // Upload audio file to Supabase Storage
    let audioUrl = null;
    if (sessionId) {
      try {
        const fileName = `${sessionId}/${Date.now()}_${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('audio-messages')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from('audio-messages')
            .getPublicUrl(fileName);
          
          audioUrl = urlData.publicUrl;
          console.log('✅ Audio file uploaded:', audioUrl);
        }
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
      }
    }

    return new Response(JSON.stringify({
      text: transcribedText,
      audioUrl: audioUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
