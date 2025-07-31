import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const POST: RequestHandler = async () => {
  try {
    console.log("🔧 Fixing audio bucket MIME types...");

    // First, let's check the current bucket configuration
    const { data: buckets, error: bucketsError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return json(
        { error: "Failed to list buckets", details: bucketsError },
        { status: 500 }
      );
    }

    const audioBucket = buckets?.find(
      (bucket) => bucket.name === "audio-messages"
    );

    if (!audioBucket) {
      console.error("❌ Audio-messages bucket not found");
      return json(
        { error: "Audio-messages bucket not found" },
        { status: 404 }
      );
    }

    console.log("📦 Current bucket config:", audioBucket);
    console.log("📦 Current allowed MIME types:", audioBucket.allowedMimeTypes);

    // Update the bucket with the correct MIME types
    const { data: updatedBucket, error: updateError } =
      await supabaseAdmin.storage.updateBucket("audio-messages", {
        allowedMimeTypes: [
          "audio/webm",
          "audio/mp4",
          "audio/wav",
          "audio/mpeg",
          "audio/ogg",
          "audio/webm;codecs=opus",
        ],
      });

    if (updateError) {
      console.error("❌ Error updating bucket:", updateError);
      return json(
        { error: "Failed to update bucket", details: updateError },
        { status: 500 }
      );
    }

    console.log("✅ Bucket updated successfully:", updatedBucket);

    // Verify the update
    const { data: verifyBuckets } = await supabaseAdmin.storage.listBuckets();
    const verifyBucket = verifyBuckets?.find(
      (bucket) => bucket.name === "audio-messages"
    );

    console.log("✅ Verified bucket config:", verifyBucket);
    console.log(
      "✅ Verified allowed MIME types:",
      verifyBucket?.allowedMimeTypes
    );

    return json({
      success: true,
      message: "Audio bucket MIME types updated successfully",
      oldMimeTypes: audioBucket.allowedMimeTypes,
      newMimeTypes: verifyBucket?.allowedMimeTypes,
    });
  } catch (error) {
    console.error("❌ Fix error:", error);
    return json(
      {
        error: "Fix failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
