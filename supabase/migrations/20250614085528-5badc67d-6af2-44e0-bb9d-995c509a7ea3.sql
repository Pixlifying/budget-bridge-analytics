
-- Create a table for OD (Overdraft) records
CREATE TABLE public.od_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount_received NUMERIC NOT NULL DEFAULT 0,
  amount_given NUMERIC NOT NULL DEFAULT 0,
  cash_in_hand NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add an index on date for better query performance
CREATE INDEX idx_od_records_date ON public.od_records(date);
