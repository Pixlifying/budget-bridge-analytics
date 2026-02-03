-- Add mobile_number column to social_security table for APY scheme
ALTER TABLE public.social_security 
ADD COLUMN IF NOT EXISTS mobile_number text;