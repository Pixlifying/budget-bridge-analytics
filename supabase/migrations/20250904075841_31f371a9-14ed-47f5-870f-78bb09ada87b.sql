-- Fix policy error from previous migration
DROP POLICY IF EXISTS "online_services_deny_anonymous_access" ON public.online_services;

CREATE POLICY "online_services_deny_anonymous_access" 
ON public.online_services 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);