import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

// Test endpoint to check OpenAI API key
export const GET: RequestHandler = async () => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          status: "error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!openaiApiKey.startsWith("sk-")) {
      return new Response(
        JSON.stringify({
          error: "Invalid OpenAI API key format",
          status: "error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test OpenAI API connection with a simple request
    const testResponse = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return new Response(
        JSON.stringify({
          error: "OpenAI API test failed",
          details: `Status: ${
            testResponse.status
          }, Response: ${errorText.substring(0, 200)}`,
          status: "error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "OpenAI API key is valid and working",
        status: "success",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "OpenAI API test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;
    const agentId = formData.get("agentId") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return new Response(
        JSON.stringify({
          error: "Invalid file type. Please provide an audio file.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 25MB." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check for OpenAI API key
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("❌ OpenAI API key not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate API key format (should start with 'sk-')
    if (!openaiApiKey.startsWith("sk-")) {
      console.error("❌ Invalid OpenAI API key format");
      return new Response(
        JSON.stringify({ error: "Invalid OpenAI API key format" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }



    // Get agent's language configuration
    let whisperLanguage = "en"; // Default to English
    if (agentId) {
      try {
        const { data: agent, error: agentError } = await supabaseAdmin
          .from("agents")
          .select("whisper_language, name")
          .eq("id", agentId)
          .single();

        if (!agentError && agent) {
          // Use the configured whisper_language field directly
          if (agent.whisper_language && agent.whisper_language !== "auto") {
            whisperLanguage = agent.whisper_language;
          }
        }
      } catch (error) {
        console.warn(
          "Could not fetch agent language config, using default:",
          error
        );
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare form data for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append(
      "file",
      new Blob([buffer], { type: file.type }),
      file.name
    );
    openaiFormData.append("model", "whisper-1");

    // Only set language if not auto-detect
    if (whisperLanguage !== "auto") {
      openaiFormData.append("language", whisperLanguage);
    }

    openaiFormData.append("response_format", "json");

    // Call OpenAI Whisper API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: openaiFormData,
      }
    );



    if (!openaiResponse.ok) {
      let errorData;
      const responseText = await openaiResponse.text();

      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "❌ Failed to parse OpenAI error response as JSON:",
          parseError
        );
        console.error("❌ Raw response text:", responseText);

        // Handle non-JSON responses (like HTML error pages)
        return new Response(
          JSON.stringify({
            error: "OpenAI API error",
            details: `Received non-JSON response (${
              openaiResponse.status
            }): ${responseText.substring(0, 200)}...`,
            status: openaiResponse.status,
            statusText: openaiResponse.statusText,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.error("❌ OpenAI Whisper API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Transcription failed",
          details: errorData.error?.message || "Unknown error",
          status: openaiResponse.status,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Try to parse the successful response
    let transcriptionData;
    try {
      const responseText = await openaiResponse.text();
      transcriptionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "❌ Failed to parse OpenAI success response as JSON:",
        parseError
      );
      console.error("❌ Raw response text:", await openaiResponse.text());

      return new Response(
        JSON.stringify({
          error: "Invalid response from OpenAI",
          details: "Received non-JSON response from OpenAI API",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const transcribedText = transcriptionData.text;



    // Enhanced detection and handling of problematic transcriptions
    let finalTranscribedText = transcribedText;

    if (
      transcribedText.includes("Untertitel") ||
      transcribedText.includes("Amara") ||
      transcribedText.includes("subtitles") ||
      transcribedText.includes("caption") ||
      transcribedText.includes("CC") ||
      transcribedText.includes("SDH")
    ) {
      console.warn("⚠️ SUSPICIOUS TRANSCRIPTION DETECTED!");
      console.warn(
        "⚠️ This suggests the audio file may contain embedded subtitles or metadata"
      );
      console.warn("⚠️ Audio file details:", {
        size: buffer.length,
        type: file.type,
        name: file.name,
        lastModified: file.lastModified,
      });

      // Try to clean the transcription by removing subtitle-related text
      finalTranscribedText = transcribedText
        .replace(/Untertitel der Amara\.org-Community/gi, "")
        .replace(/subtitles?/gi, "")
        .replace(/caption/gi, "")
        .replace(/CC/gi, "")
        .replace(/SDH/gi, "")
        .replace(/Amara\.org/gi, "")
        .replace(/\s+/g, " ")
        .trim();



      // If the cleaned text is too short, it might be invalid
      if (finalTranscribedText.length < 5) {
        console.error(
          "❌ Cleaned transcription too short, likely invalid audio"
        );
        return new Response(
          JSON.stringify({
            error:
              "Invalid audio content detected. The audio file may contain embedded subtitles or metadata instead of speech. Please try recording again with a clean audio source.",
            details:
              "Audio appears to contain subtitle metadata rather than speech",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Additional validation for transcription quality
    if (finalTranscribedText.length < 3) {
      console.error("❌ Transcription too short, likely no speech detected");
      return new Response(
        JSON.stringify({
          error:
            "No speech detected in the audio. Please ensure you're speaking clearly and try again.",
          details: "Transcription result too short",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Upload audio file to Supabase Storage
    let audioUrl = null;

    if (sessionId) {
      try {
        const fileName = `${sessionId}/${Date.now()}_audio.webm`;

        // Check if bucket exists first
        const { data: buckets, error: bucketsError } =
          await supabaseAdmin.storage.listBuckets();
        if (bucketsError) {
          console.error("❌ Error listing buckets:", bucketsError);
        }

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("audio-messages")
            .upload(fileName, buffer, {
              contentType: "audio/webm",
              upsert: false,
            });

        if (uploadError) {
          console.error("❌ Storage upload error:", uploadError);
          console.error(
            "❌ Upload error details:",
            JSON.stringify(uploadError, null, 2)
          );
          console.error("❌ Upload error message:", uploadError.message);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from("audio-messages")
            .getPublicUrl(fileName);

          audioUrl = urlData.publicUrl;
        }
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        console.error(
          "❌ Storage error details:",
          JSON.stringify(storageError, null, 2)
        );
        if (storageError instanceof Error) {
          console.error("❌ Storage error name:", storageError.name);
          console.error("❌ Storage error message:", storageError.message);
        }
      }
    } else {
      console.warn("⚠️ No sessionId provided, skipping audio upload");
    }

    return new Response(
      JSON.stringify({
        text: finalTranscribedText,
        audioUrl: audioUrl,
        originalText: transcribedText,
        wasCleaned: finalTranscribedText !== transcribedText,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Transcription error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
