import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Simple audio storage test...");

    // Test 1: Check if we can list buckets
    console.log("📦 Testing bucket listing...");
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return json({ 
        error: "Failed to list buckets", 
        details: bucketsError,
        step: "bucket_listing"
      }, { status: 500 });
    }

    console.log("✅ Buckets found:", buckets?.map(b => b.name) || []);

    // Test 2: Check if audio-messages bucket exists
    const audioBucket = buckets?.find(bucket => bucket.name === 'audio-messages');
    
    if (!audioBucket) {
      console.log("❌ Audio-messages bucket not found, attempting to create...");
      
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('audio-messages', {
        public: true,
        fileSizeLimit: 26214400, // 25MB
        allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm;codecs=opus']
      });

      if (createError) {
        console.error("❌ Error creating bucket:", createError);
        return json({ 
          error: "Failed to create audio-messages bucket", 
          details: createError,
          step: "bucket_creation"
        }, { status: 500 });
      }

      console.log("✅ Audio-messages bucket created:", newBucket);
    } else {
      console.log("✅ Audio-messages bucket already exists:", audioBucket);
    }

    // Test 3: Try to upload a simple test file
    console.log("📤 Testing file upload...");
    const testContent = "This is a test audio file content";
    const testBuffer = new TextEncoder().encode(testContent);
    
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('audio-messages')
      .upload(testFileName, testBuffer, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError);
      return json({ 
        error: "Failed to upload test file", 
        details: uploadError,
        step: "file_upload"
      }, { status: 500 });
    }

    console.log("✅ Test file uploaded successfully:", uploadData);

    // Test 4: Try to get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('audio-messages')
      .getPublicUrl(testFileName);

    console.log("✅ Public URL generated:", urlData.publicUrl);

    // Test 5: Clean up the test file
    const { error: deleteError } = await supabaseAdmin.storage
      .from('audio-messages')
      .remove([testFileName]);

    if (deleteError) {
      console.warn("⚠️ Failed to clean up test file:", deleteError);
    } else {
      console.log("✅ Test file cleaned up");
    }

    return json({
      success: true,
      message: "Audio storage test completed successfully",
      buckets: buckets?.map(b => b.name) || [],
      audioBucketExists: !!audioBucket,
      testUploadSuccess: true,
      publicUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error("❌ Simple test error:", error);
    return json({ 
      error: "Simple test failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      step: "general"
    }, { status: 500 });
  }
}; 