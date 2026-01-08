-- Create account_records table for storing extracted account information
CREATE TABLE public.account_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('from', 'to', 'both')),
  name TEXT,
  aadhar_number TEXT,
  mobile_number TEXT,
  address TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.account_records ENABLE ROW LEVEL SECURITY;

-- Create policies for admin and manager access
CREATE POLICY "Admins and managers can manage account records" 
ON public.account_records 
FOR ALL 
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

-- Deny anonymous access
CREATE POLICY "account_records_deny_anonymous_access" 
ON public.account_records 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_account_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_account_records_updated_at
BEFORE UPDATE ON public.account_records
FOR EACH ROW
EXECUTE FUNCTION public.update_account_records_updated_at();