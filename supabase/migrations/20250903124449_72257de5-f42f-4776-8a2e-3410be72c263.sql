-- CRITICAL SECURITY FIX: Secure khata_customers table
-- This table contains sensitive customer PII (names, phone numbers)
-- and must be protected from public access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on khata_customers" ON public.khata_customers;

-- Create a restrictive policy that denies all anonymous access
-- This immediately stops the data leak
CREATE POLICY "khata_customers_deny_anonymous_access" 
ON public.khata_customers 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

-- Allow access only for properly authenticated users
CREATE POLICY "khata_customers_authenticated_access" 
ON public.khata_customers 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Add security comment
COMMENT ON TABLE public.khata_customers IS 'SECURITY: Contains customer PII (names, phone numbers). Protected by RLS - requires Supabase authentication.';