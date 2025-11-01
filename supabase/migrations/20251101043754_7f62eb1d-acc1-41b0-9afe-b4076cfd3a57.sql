-- Add expense and update total calculation for online_services
ALTER TABLE public.online_services
ADD COLUMN IF NOT EXISTS expense numeric DEFAULT 0;

-- Remove count column from online_services as it's no longer needed
ALTER TABLE public.online_services
DROP COLUMN IF EXISTS count;

-- Add expense column to applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS expense numeric DEFAULT 0;

-- Remove pages_count column from applications
ALTER TABLE public.applications
DROP COLUMN IF EXISTS pages_count;

-- Add expense column to photostats
ALTER TABLE public.photostats
ADD COLUMN IF NOT EXISTS expense numeric DEFAULT 0;

-- Remove pages_count and amount_per_page columns from photostats
ALTER TABLE public.photostats
DROP COLUMN IF EXISTS pages_count;

ALTER TABLE public.photostats
DROP COLUMN IF EXISTS amount_per_page;

-- Rename total_amount to amount in photostats for consistency
ALTER TABLE public.photostats
RENAME COLUMN total_amount TO amount;

-- Update margin to be calculated as amount - expense for existing records
UPDATE public.online_services
SET total = amount - COALESCE(expense, 0);

UPDATE public.applications
SET amount = amount WHERE amount IS NOT NULL;

UPDATE public.photostats
SET margin = amount - COALESCE(expense, 0) WHERE margin IS NOT NULL;