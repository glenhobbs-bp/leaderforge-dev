-- Add missing INSERT policy for avatar uploads
-- This allows authenticated users to upload avatar files

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Also add a DELETE policy in case users want to replace their avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
);