-- Storage Bucket Setup
-- Run this in Supabase SQL Editor after enabling storage

-- Create buckets (do this via Supabase Dashboard or API)
-- Bucket: tender-documents
-- Bucket: exports

-- Storage Policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'tender-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'tender-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'tender-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Exports bucket policies
CREATE POLICY "Users can view own exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'exports' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
