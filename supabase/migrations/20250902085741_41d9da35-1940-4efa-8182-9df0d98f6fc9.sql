-- CRITICAL SECURITY FIX: Replace overly permissive RLS policies on forms table
-- This table contains sensitive PII data and must be protected

-- First, drop the existing dangerous policy that allows public access
DROP POLICY IF EXISTS "Allow all operations on forms" ON public.forms;

-- Create a restrictive policy that denies all public access
-- This is a temporary security measure until proper authentication is implemented
CREATE POLICY "Deny all public access to forms" 
ON public.forms 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Also ensure RLS is enabled on forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- For immediate functionality, create a policy for authenticated users only
-- This requires proper Supabase authentication to work
CREATE POLICY "Allow authenticated users to manage forms" 
ON public.forms 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Add comment explaining the security fix
COMMENT ON TABLE public.forms IS 'Contains sensitive PII data including names, addresses, mobile numbers. Requires proper authentication.';