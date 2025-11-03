-- Create table for Life Certificate (DLC) records
CREATE TABLE public.dlc_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pensioner_name TEXT NOT NULL,
  ppo_number TEXT NOT NULL,
  account_number TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dlc_records ENABLE ROW LEVEL SECURITY;

-- Create policies for admins and managers
CREATE POLICY "Admins and managers can manage dlc records"
ON public.dlc_records
FOR ALL
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

-- Deny anonymous access
CREATE POLICY "dlc_records_deny_anonymous_access"
ON public.dlc_records
FOR ALL
USING (false)
WITH CHECK (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dlc_records_updated_at
BEFORE UPDATE ON public.dlc_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();