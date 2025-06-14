
-- Add the missing last_balance column to the od_records table
ALTER TABLE public.od_records 
ADD COLUMN last_balance numeric NOT NULL DEFAULT 0;
