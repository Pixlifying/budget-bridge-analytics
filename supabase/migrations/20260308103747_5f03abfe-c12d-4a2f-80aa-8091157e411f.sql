
-- Add profile_image_url column to user_admin table
ALTER TABLE public.user_admin ADD COLUMN IF NOT EXISTS profile_image_url text DEFAULT NULL;

-- Create a public storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to profile-images bucket
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update their profile images
CREATE POLICY "Authenticated users can update profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images');

-- Allow authenticated users to delete profile images
CREATE POLICY "Authenticated users can delete profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images');

-- Allow public read access to profile images
CREATE POLICY "Public read access to profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');
