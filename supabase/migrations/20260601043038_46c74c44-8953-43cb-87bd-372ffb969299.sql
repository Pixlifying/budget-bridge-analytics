
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete documents" ON storage.objects;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Templates" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Only admins can update roles"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role, auth.uid()))
WITH CHECK (public.has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role, auth.uid()));
