import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const GET: RequestHandler = async () => {
  try {
    console.log("🧪 Testing audio storage bucket...");

    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return json({ error: "Failed to list buckets", details: bucketsError }, { status: 500 });
    }

    const audioBucket = buckets.find(bucket => bucket.name === 'audio-messages');
    
    if (!audioBucket) {
      console.error("❌ Audio-messages bucket not found");
      return json({ error: "Audio-messages bucket not found", availableBuckets: buckets.map(b => b.name) }, { status: 404 });
    }

    console.log("✅ Audio-messages bucket found:", audioBucket);

    // Try to list files in the bucket
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('audio-messages')
      .list('', { limit: 10 });

    if (filesError) {
      console.error("❌ Error listing files:", filesError);
      return json({ error: "Failed to list files", details: filesError }, { status: 500 });
    }

    console.log("✅ Files in audio-messages bucket:", files);

    return json({
      success: true,
      bucket: audioBucket,
      files: files,
      bucketExists: true,
      canListFiles: true
    });

  } catch (error) {
    console.error("❌ Test error:", error);
    return json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 