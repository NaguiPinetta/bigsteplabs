-- Setup Audio Storage for Voice Messages
-- Run this in your Supabase SQL Editor

-- Step 1: Create the audio-messages storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-messages',
  'audio-messages',
  true,
  26214400, -- 25MB limit (same as Whisper API)
  ARRAY['audio/wav', 'audio/mp3', 'audio/mp4', 'audio/webm', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload audio messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their audio messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their audio messages" ON storage.objects;

-- Step 3: Create RLS policies for the audio-messages bucket
-- Allow authenticated users to upload audio files
CREATE POLICY "Users can upload audio messages" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-messages' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to view their own audio files (based on session ownership)
CREATE POLICY "Users can view their audio messages" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio-messages' 
    AND auth.role() = 'authenticated'
    AND (
      -- Allow access if the file path contains their session ID
      -- This is a simple check - you might want to make this more sophisticated
      EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE chat_sessions.id::text = SPLIT_PART(name, '/', 2)
        AND chat_sessions.user_id = auth.uid()
      )
    )
  );

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their audio messages" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio-messages' 
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE chat_sessions.id::text = SPLIT_PART(name, '/', 2)
        AND chat_sessions.user_id = auth.uid()
      )
    )
  );

-- Step 4: Verify the setup
SELECT 
  'audio-messages' as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'audio-messages';

-- Step 5: Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 