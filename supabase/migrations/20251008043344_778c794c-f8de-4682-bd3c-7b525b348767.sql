-- Create social_security table
CREATE TABLE public.social_security (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  account_number text NOT NULL,
  address text,
  scheme_type text NOT NULL,
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_security ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and managers can manage social security"
ON public.social_security
FOR ALL
TO authenticated
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

CREATE POLICY "Deny anonymous access to social_security"
ON public.social_security
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER update_social_security_updated_at
BEFORE UPDATE ON public.social_security
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();