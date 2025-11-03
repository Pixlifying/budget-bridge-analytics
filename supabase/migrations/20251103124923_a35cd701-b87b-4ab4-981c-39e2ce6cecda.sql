-- Create table for udhar (money lending) records
CREATE TABLE public.udhar_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.udhar_records ENABLE ROW LEVEL SECURITY;

-- Create policies for admin and manager access
CREATE POLICY "Admins and managers can manage udhar records"
  ON public.udhar_records
  FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- Deny anonymous access
CREATE POLICY "udhar_records_deny_anonymous_access"
  ON public.udhar_records
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_udhar_records_updated_at
  BEFORE UPDATE ON public.udhar_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();