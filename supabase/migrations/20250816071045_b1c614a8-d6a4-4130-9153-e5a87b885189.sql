-- Enable Row Level Security on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy to require authentication for all operations on customers table
CREATE POLICY "Authenticated users can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy to deny all access to anonymous users
CREATE POLICY "Deny anonymous access to customers" 
ON public.customers 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);