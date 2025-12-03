-- Drop the od_records table
DROP TABLE IF EXISTS public.od_records;

-- Add extra_amount column to banking_services
ALTER TABLE public.banking_services 
ADD COLUMN extra_amount numeric DEFAULT 0;