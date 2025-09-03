-- CRITICAL SECURITY FIX: Enable RLS on banking_accounts table
-- This table contains sensitive financial data (customer names, account numbers, amounts)
-- and must be protected from public access

-- Enable Row Level Security on banking_accounts table
ALTER TABLE public.banking_accounts ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on banking_accounts" ON public.banking_accounts;
DROP POLICY IF EXISTS "Public access to banking_accounts" ON public.banking_accounts;

-- Create a restrictive policy that denies all anonymous access
-- This immediately stops the data leak
CREATE POLICY "banking_accounts_deny_anonymous_access" 
ON public.banking_accounts 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

-- Allow access only for properly authenticated users
CREATE POLICY "banking_accounts_authenticated_access" 
ON public.banking_accounts 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Add security comment
COMMENT ON TABLE public.banking_accounts IS 'SECURITY: Contains sensitive financial data (customer names, account numbers, transaction amounts). Protected by RLS - requires Supabase authentication.';