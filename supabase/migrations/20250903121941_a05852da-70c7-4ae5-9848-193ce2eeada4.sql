-- CRITICAL SECURITY FIX: Replace overly permissive RLS policies on forms table
-- This table contains sensitive PII data and must be protected

-- Drop all existing policies on the forms table
DROP POLICY IF EXISTS "Allow all operations on forms" ON public.forms;
DROP POLICY IF EXISTS "Deny all public access to forms" ON public.forms;
DROP POLICY IF EXISTS "Allow authenticated users to manage forms" ON public.forms;

-- Create a restrictive policy that denies all anonymous access
-- This immediately stops the data leak
CREATE POLICY "forms_deny_anonymous_access" 
ON public.forms 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

-- Allow access only for properly authenticated users
CREATE POLICY "forms_authenticated_access" 
ON public.forms 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Add security comment
COMMENT ON TABLE public.forms IS 'SECURITY: Contains sensitive PII (names, addresses, mobile, Aadhar numbers). Protected by RLS - requires Supabase authentication.';