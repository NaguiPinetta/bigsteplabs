-- Setup Audio Storage Bucket
-- This script creates the audio-messages bucket and sets up proper permissions

-- Create the audio-messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-messages',
  'audio-messages',
  true,
  26214400, -- 25MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm;codecs=opus']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the audio-messages bucket
-- Allow authenticated users to upload audio files
CREATE POLICY "Allow authenticated users to upload audio" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-messages' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to read audio files
CREATE POLICY "Allow authenticated users to read audio" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-messages' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own audio files
CREATE POLICY "Allow users to update own audio" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio-messages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own audio files
CREATE POLICY "Allow users to delete own audio" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio-messages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'audio-messages'; 