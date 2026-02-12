-- First, remove duplicate account_details keeping only the most recent entry per account_number
DELETE FROM public.account_details
WHERE id NOT IN (
  SELECT DISTINCT ON (account_number) id
  FROM public.account_details
  ORDER BY account_number, updated_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.account_details ADD CONSTRAINT unique_account_number UNIQUE (account_number);