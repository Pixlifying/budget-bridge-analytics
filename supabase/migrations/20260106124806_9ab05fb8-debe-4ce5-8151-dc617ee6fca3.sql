-- Create table for CSV analysis records
CREATE TABLE public.csv_analysis_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_name TEXT NOT NULL,
  total_withdrawal NUMERIC NOT NULL DEFAULT 0,
  total_deposit NUMERIC NOT NULL DEFAULT 0,
  cash_in_hand NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.csv_analysis_records ENABLE ROW LEVEL SECURITY;

-- Create policies for admin/manager access
CREATE POLICY "Admins and managers can manage csv analysis records" 
ON public.csv_analysis_records 
FOR ALL 
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

-- Deny anonymous access
CREATE POLICY "csv_analysis_records_deny_anonymous_access" 
ON public.csv_analysis_records 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_csv_analysis_records_updated_at
BEFORE UPDATE ON public.csv_analysis_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();