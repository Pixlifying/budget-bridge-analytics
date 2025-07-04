
-- Add department column to forms table
ALTER TABLE public.forms ADD COLUMN department TEXT;

-- Set a default department for existing records
UPDATE public.forms SET department = 'General' WHERE department IS NULL;

-- Make department column not null with default value
ALTER TABLE public.forms ALTER COLUMN department SET NOT NULL;
ALTER TABLE public.forms ALTER COLUMN department SET DEFAULT 'General';
