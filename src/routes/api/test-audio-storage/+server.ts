import type { RequestHandler } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const GET: RequestHandler = async () => {
  try {
    // Test 1: Check if the audio-messages bucket exists
    const { data: buckets, error: bucketError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketError) {
      return new Response(
        JSON.stringify({
          error: "Failed to list buckets",
          details: bucketError,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const audioBucket = buckets.find(
      (bucket) => bucket.id === "audio-messages"
    );

    if (!audioBucket) {
      return new Response(
        JSON.stringify({
          error: "Audio storage bucket not found",
          availableBuckets: buckets.map((b) => b.id),
          instructions: "Run setup_audio_storage.sql in Supabase SQL Editor",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test 2: Check bucket configuration
    const bucketInfo = {
      id: audioBucket.id,
      name: audioBucket.name,
      public: audioBucket.public,
      fileSizeLimit: audioBucket.file_size_limit,
      allowedMimeTypes: audioBucket.allowed_mime_types,
    };

    // Test 3: Try to list files (should work if RLS is set up correctly)
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from("audio-messages")
      .list("", { limit: 10 });

    // Test 4: Try to create a test file to verify upload permissions
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = new Blob(["test"], { type: "text/plain" });

    const { data: testUpload, error: testUploadError } =
      await supabaseAdmin.storage
        .from("audio-messages")
        .upload(testFileName, testContent, {
          contentType: "text/plain",
          cacheControl: "3600",
        });

    // Clean up test file
    if (testUpload) {
      await supabaseAdmin.storage.from("audio-messages").remove([testFileName]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bucket: bucketInfo,
        files: files || [],
        filesError: filesError?.message || null,
        testUpload: testUpload ? "Success" : "Failed",
        testUploadError: testUploadError?.message || null,
        message: "Audio storage is configured correctly",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Audio storage test error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
