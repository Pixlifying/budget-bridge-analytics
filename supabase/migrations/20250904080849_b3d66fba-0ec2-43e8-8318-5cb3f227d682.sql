-- PHASE 1 SECURITY HARDENING: Database and Storage
-- Fix critical security vulnerabilities identified in security review

-- 1. SECURE STORAGE BUCKETS
-- Make buckets private and add proper policies
UPDATE storage.buckets SET public = false WHERE id IN ('templates', 'documents');

-- Remove any existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can insert uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete uploaded documents" ON storage.objects;

-- Create secure storage policies for templates bucket
CREATE POLICY "Authenticated users can view templates" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload templates" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'templates');

CREATE POLICY "Authenticated users can update templates" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can delete templates" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'templates');

-- Create secure storage policies for documents bucket  
CREATE POLICY "Authenticated users can view documents" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'documents');

-- 2. FIX OVERLY PERMISSIVE RLS POLICIES ON DATA TABLES
-- Replace "Allow all operations" policies with secure ones

-- Fix uploaded_documents table
DROP POLICY IF EXISTS "Anyone can view uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can insert uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can update uploaded documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Anyone can delete uploaded documents" ON public.uploaded_documents;

CREATE POLICY "Deny anonymous access to uploaded_documents" 
ON public.uploaded_documents 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage uploaded_documents" 
ON public.uploaded_documents 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix ledger_customers table  
DROP POLICY IF EXISTS "Allow all operations on ledger_customers" ON public.ledger_customers;

CREATE POLICY "Deny anonymous access to ledger_customers" 
ON public.ledger_customers 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage ledger_customers" 
ON public.ledger_customers 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix pan_cards table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.pan_cards;

CREATE POLICY "Deny anonymous access to pan_cards" 
ON public.pan_cards 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage pan_cards" 
ON public.pan_cards 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix passports table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.passports;

CREATE POLICY "Deny anonymous access to passports" 
ON public.passports 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage passports" 
ON public.passports 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix expenses table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.expenses;

CREATE POLICY "Deny anonymous access to expenses" 
ON public.expenses 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage expenses" 
ON public.expenses 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix banking_services table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.banking_services;

CREATE POLICY "Deny anonymous access to banking_services" 
ON public.banking_services 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage banking_services" 
ON public.banking_services 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix fee_expenses table
DROP POLICY IF EXISTS "Allow all operations on fee_expenses" ON public.fee_expenses;

CREATE POLICY "Deny anonymous access to fee_expenses" 
ON public.fee_expenses 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage fee_expenses" 
ON public.fee_expenses 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix misc_expenses table
DROP POLICY IF EXISTS "Allow all operations on misc_expenses" ON public.misc_expenses;

CREATE POLICY "Deny anonymous access to misc_expenses" 
ON public.misc_expenses 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage misc_expenses" 
ON public.misc_expenses 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix daily_needs table
DROP POLICY IF EXISTS "Allow all operations on daily_needs" ON public.daily_needs;

CREATE POLICY "Deny anonymous access to daily_needs" 
ON public.daily_needs 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage daily_needs" 
ON public.daily_needs 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix user_admin table
DROP POLICY IF EXISTS "Allow all operations on user_admin" ON public.user_admin;

CREATE POLICY "Deny anonymous access to user_admin" 
ON public.user_admin 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage user_admin" 
ON public.user_admin 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Fix khata_transactions table
DROP POLICY IF EXISTS "Allow all operations on khata_transactions" ON public.khata_transactions;

CREATE POLICY "Deny anonymous access to khata_transactions" 
ON public.khata_transactions 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "Authenticated users can manage khata_transactions" 
ON public.khata_transactions 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 3. FIX SECURITY DEFINER FUNCTION SEARCH PATH
-- Recreate handle_new_user function with secure search_path
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;