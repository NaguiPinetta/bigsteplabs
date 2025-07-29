import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

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
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
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
          console.log(
            `🔍 Agent "${agent.name}" whisper_language: ${agent.whisper_language}`
          );

          // Use the configured whisper_language field directly
          if (agent.whisper_language && agent.whisper_language !== "auto") {
            whisperLanguage = agent.whisper_language;
            console.log(`🌍 Using configured language: ${whisperLanguage}`);
          } else {
            console.log(
              `🌍 Agent has auto-detect or no language configured, using default: ${whisperLanguage}`
            );
          }
        }
      } catch (error) {
        console.warn(
          "Could not fetch agent language config, using default:",
          error
        );
      }
    }

    console.log(`🎤 Final whisper language setting: ${whisperLanguage}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      `📁 Audio file size: ${buffer.length} bytes, type: ${file.type}`
    );

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
      console.log(`🌍 Setting Whisper language to: ${whisperLanguage}`);
    } else {
      console.log(`🌍 Using auto-detect for language`);
    }

    openaiFormData.append("response_format", "json");

    console.log(`🎤 Calling OpenAI Whisper API...`);

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

    console.log(`📡 OpenAI response status: ${openaiResponse.status}`);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("❌ OpenAI Whisper API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Transcription failed",
          details: errorData.error?.message || "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const transcriptionData = await openaiResponse.json();
    const transcribedText = transcriptionData.text;

    console.log("✅ Transcription successful:", transcribedText);
    console.log(
      "📊 Transcription data:",
      JSON.stringify(transcriptionData, null, 2)
    );

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

      console.log("🧹 Cleaned transcription:", finalTranscribedText);

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
        const fileName = `${sessionId}/${Date.now()}_${file.name}`;

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("audio-messages")
            .upload(fileName, buffer, {
              contentType: file.type,
              upsert: false,
            });

        if (uploadError) {
          console.error("❌ Storage upload error:", uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from("audio-messages")
            .getPublicUrl(fileName);

          audioUrl = urlData.publicUrl;
          console.log("✅ Audio file uploaded:", audioUrl);
        }
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
      }
    }

    return new Response(
      JSON.stringify({
        text: finalTranscribedText,
        audioUrl: audioUrl,
        originalText: transcribedText, // Include original for debugging
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
