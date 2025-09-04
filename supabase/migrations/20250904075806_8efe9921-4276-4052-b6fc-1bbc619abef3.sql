-- Fix critical security issue: Customer Personal Information Could Be Stolen
-- Update RLS policies for tables with sensitive customer data

-- Fix pending_balances table
DROP POLICY IF EXISTS "Allow all operations for now" ON public.pending_balances;

CREATE POLICY "pending_balances_authenticated_access" 
ON public.pending_balances 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "pending_balances_deny_anonymous_access" 
ON public.pending_balances 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

-- Fix online_services table  
DROP POLICY IF EXISTS "Allow all operations for now" ON public.online_services;

CREATE POLICY "online_services_authenticated_access" 
ON public.online_services 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "online_services_deny_anonymous_access" 
ON public.online_services 
FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);