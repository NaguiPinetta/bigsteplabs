import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const POST: RequestHandler = async () => {
  try {

    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return json({ error: "Failed to list buckets", details: bucketsError }, { status: 500 });
    }

    
    const audioBucket = buckets.find(bucket => bucket.name === 'audio-messages');
    
    if (!audioBucket) {
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('audio-messages', {
        public: true,
        fileSizeLimit: 26214400, // 25MB
        allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm;codecs=opus']
      });

      if (createError) {
        console.error("❌ Error creating bucket:", createError);
        return json({ error: "Failed to create bucket", details: createError }, { status: 500 });
      }

    } else {
    }

    // Set up RLS policies
    
    // Allow authenticated users to upload audio files
    const { error: insertPolicyError } = await supabaseAdmin.rpc('create_policy_if_not_exists', {
      policy_name: 'Allow authenticated users to upload audio',
      table_name: 'storage.objects',
      definition: "FOR INSERT WITH CHECK (bucket_id = 'audio-messages' AND auth.role() = 'authenticated')"
    });

    if (insertPolicyError) {
      console.warn("⚠️ Insert policy error (might already exist):", insertPolicyError);
    }

    // Allow authenticated users to read audio files
    const { error: selectPolicyError } = await supabaseAdmin.rpc('create_policy_if_not_exists', {
      policy_name: 'Allow authenticated users to read audio',
      table_name: 'storage.objects',
      definition: "FOR SELECT USING (bucket_id = 'audio-messages' AND auth.role() = 'authenticated')"
    });

    if (selectPolicyError) {
      console.warn("⚠️ Select policy error (might already exist):", selectPolicyError);
    }


    return json({
      success: true,
      message: "Audio storage bucket setup completed",
      bucketExists: true
    });

  } catch (error) {
    console.error("❌ Setup error:", error);
    return json({ 
      error: "Setup failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 