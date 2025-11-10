-- Add parman_id column to dlc_records table
ALTER TABLE public.dlc_records 
ADD COLUMN parman_id text;