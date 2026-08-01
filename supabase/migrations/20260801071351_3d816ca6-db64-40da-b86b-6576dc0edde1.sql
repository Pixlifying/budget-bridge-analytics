
-- 1) Documents bucket: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

CREATE POLICY "Admins and managers can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.is_admin_or_manager(auth.uid()))
WITH CHECK (bucket_id = 'documents' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.is_admin_or_manager(auth.uid()));

-- 2) Templates bucket: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON storage.objects;

CREATE POLICY "Admins and managers can view templates"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'templates' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can upload templates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'templates' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can update templates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'templates' AND public.is_admin_or_manager(auth.uid()))
WITH CHECK (bucket_id = 'templates' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can delete templates"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'templates' AND public.is_admin_or_manager(auth.uid()));

-- 3) profile-images: enforce owner folder on INSERT, remove broad listing policy
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile images" ON storage.objects;

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can view their own profile images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 4) Lock down SECURITY DEFINER helper/trigger functions from direct API execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_account_records_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(app_role, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(uuid) FROM anon;
