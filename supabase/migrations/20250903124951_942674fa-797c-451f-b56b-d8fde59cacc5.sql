-- COMPREHENSIVE SECURITY FIX: Secure all vulnerable tables and storage
-- Phase 1: Fix critical RLS policy vulnerabilities

-- 1. Fix uploaded_documents table - currently allows anonymous access
DROP POLICY IF EXISTS "Anyone can view uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can insert uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can update uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can delete uploaded documents" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_deny_anonymous_access" 
ON public.uploaded_documents 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "uploaded_documents_authenticated_access" 
ON public.uploaded_documents 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 2. Fix templates table - no RLS policies at all
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_deny_anonymous_access" 
ON public.templates 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "templates_authenticated_access" 
ON public.templates 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 3. Fix online_services table - overly permissive
DROP POLICY IF EXISTS "Allow all operations for now" ON public.online_services;

CREATE POLICY "online_services_deny_anonymous_access" 
ON public.online_services 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "online_services_authenticated_access" 
ON public.online_services 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 4. Fix banking_services table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.banking_services;

CREATE POLICY "banking_services_deny_anonymous_access" 
ON public.banking_services 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "banking_services_authenticated_access" 
ON public.banking_services 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 5. Fix pending_balances table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.pending_balances;

CREATE POLICY "pending_balances_deny_anonymous_access" 
ON public.pending_balances 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "pending_balances_authenticated_access" 
ON public.pending_balances 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 6. Fix pan_cards table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.pan_cards;

CREATE POLICY "pan_cards_deny_anonymous_access" 
ON public.pan_cards 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "pan_cards_authenticated_access" 
ON public.pan_cards 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 7. Fix passports table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.passports;

CREATE POLICY "passports_deny_anonymous_access" 
ON public.passports 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "passports_authenticated_access" 
ON public.passports 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 8. Fix expenses table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.expenses;

CREATE POLICY "expenses_deny_anonymous_access" 
ON public.expenses 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "expenses_authenticated_access" 
ON public.expenses 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 9. Enable RLS on tables that don't have it enabled
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photostats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_records ENABLE ROW LEVEL SECURITY;

-- Create deny anonymous policies for newly secured tables
CREATE POLICY "applications_deny_anonymous_access" 
ON public.applications 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "applications_authenticated_access" 
ON public.applications 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "schools_deny_anonymous_access" 
ON public.schools 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "schools_authenticated_access" 
ON public.schools 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "classes_deny_anonymous_access" 
ON public.classes 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "classes_authenticated_access" 
ON public.classes 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "subjects_deny_anonymous_access" 
ON public.subjects 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "subjects_authenticated_access" 
ON public.subjects 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "customer_transactions_deny_anonymous_access" 
ON public.customer_transactions 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "customer_transactions_authenticated_access" 
ON public.customer_transactions 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "photostats_deny_anonymous_access" 
ON public.photostats 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "photostats_authenticated_access" 
ON public.photostats 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "od_records_deny_anonymous_access" 
ON public.od_records 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "od_records_authenticated_access" 
ON public.od_records 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 10. Secure storage buckets - make them private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('templates', 'documents');

-- Create proper storage policies for authenticated users only
CREATE POLICY "templates_bucket_authenticated_access" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'templates') 
WITH CHECK (bucket_id = 'templates');

CREATE POLICY "documents_bucket_authenticated_access" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'documents') 
WITH CHECK (bucket_id = 'documents');

-- 11. Fix handle_new_user function security
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public  -- Fixed: immutable search_path
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

-- Add security comments
COMMENT ON TABLE public.uploaded_documents IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.templates IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.online_services IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.banking_services IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.pending_balances IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.pan_cards IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.passports IS 'SECURITY: Protected by RLS - requires authentication';
COMMENT ON TABLE public.expenses IS 'SECURITY: Protected by RLS - requires authentication';