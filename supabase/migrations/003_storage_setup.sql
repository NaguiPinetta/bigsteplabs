-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('public', 'public', true, 52428800, null), -- 50MB public bucket
    ('user-uploads', 'user-uploads', false, 104857600, ARRAY['image/*', 'application/pdf', 'text/*', 'audio/*', 'video/*']), -- 100MB private bucket
    ('content', 'content', false, 524288000, ARRAY['image/*', 'application/pdf', 'text/*', 'audio/*', 'video/*', 'application/*']), -- 500MB content bucket
    ('datasets', 'datasets', false, 104857600, ARRAY['application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']) -- 100MB datasets bucket
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public bucket
CREATE POLICY "Public bucket is readable by everyone" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'public');

CREATE POLICY "Authenticated users can upload to public bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'public' AND auth.uid() IS NOT NULL);

-- Storage policies for user-uploads bucket
CREATE POLICY "Users can view their own uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-uploads' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Users can upload to their own folder" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Users can update their own uploads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'user-uploads' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'user-uploads' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Admins can manage all user uploads" 
ON storage.objects FOR ALL 
USING (
    bucket_id = 'user-uploads' 
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
);

-- Storage policies for content bucket
CREATE POLICY "Students can view published content" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'content'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Student')
);

CREATE POLICY "Admins and Collaborators can manage content bucket" 
ON storage.objects FOR ALL 
USING (
    bucket_id = 'content'
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('Admin', 'Collaborator'))
);

-- Storage policies for datasets bucket
CREATE POLICY "Users can view their own dataset files" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'datasets'
    AND (auth.uid()::text = (storage.foldername(name))[1]
         OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin'))
);

CREATE POLICY "Users can upload dataset files to their folder" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'datasets' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Users can update their own dataset files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'datasets' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Users can delete their own dataset files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'datasets' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Admins can manage all dataset files" 
ON storage.objects FOR ALL 
USING (
    bucket_id = 'datasets' 
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
); 