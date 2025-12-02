-- Create od_detail_records table for the new OD Records page
CREATE TABLE public.od_detail_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  od_from_bank NUMERIC NOT NULL DEFAULT 0,
  last_balance NUMERIC NOT NULL DEFAULT 0,
  amount_received NUMERIC NOT NULL DEFAULT 0,
  amount_given NUMERIC NOT NULL DEFAULT 0,
  cash_in_hand NUMERIC NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.od_detail_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins and managers can manage od detail records" 
ON public.od_detail_records 
FOR ALL 
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

CREATE POLICY "od_detail_records_deny_anonymous_access" 
ON public.od_detail_records 
FOR ALL 
USING (false)
WITH CHECK (false);