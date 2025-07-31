import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log("🧪 Testing audio upload functionality...");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 File info:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("📦 Buffer size:", buffer.length);

    // Test upload
    const fileName = `test/${Date.now()}_${file.name}`;
    console.log("🎵 Attempting to upload file:", fileName);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("audio-messages")
      .upload(fileName, buffer, {
        contentType: "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return json(
        {
          error: "Upload failed",
          details: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode,
        },
        { status: 500 }
      );
    }

    console.log("✅ Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("audio-messages")
      .getPublicUrl(fileName);

    console.log("✅ Public URL:", urlData);

    return json({
      success: true,
      uploadData,
      urlData,
      audioUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    return json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
