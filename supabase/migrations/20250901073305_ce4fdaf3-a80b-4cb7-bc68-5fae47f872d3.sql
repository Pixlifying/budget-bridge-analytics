-- Drop the overly permissive policy on account_details table
DROP POLICY IF EXISTS "Allow all operations on account_details" ON public.account_details;

-- Create policy to require authentication for SELECT operations on account_details table
CREATE POLICY "Authenticated users can view account details" 
ON public.account_details 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to require authentication for INSERT operations on account_details table
CREATE POLICY "Authenticated users can create account details" 
ON public.account_details 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to require authentication for UPDATE operations on account_details table
CREATE POLICY "Authenticated users can update account details" 
ON public.account_details 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy to require authentication for DELETE operations on account_details table
CREATE POLICY "Authenticated users can delete account details" 
ON public.account_details 
FOR DELETE 
TO authenticated 
USING (true);

-- Create policy to deny all access to anonymous users
CREATE POLICY "Deny anonymous access to account details" 
ON public.account_details 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);