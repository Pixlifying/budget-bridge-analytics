ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.online_services ADD COLUMN IF NOT EXISTS mobile_number TEXT;