-- Add expense and margin columns to banking_accounts table
ALTER TABLE public.banking_accounts 
ADD COLUMN expense numeric DEFAULT 0,
ADD COLUMN margin numeric DEFAULT 0;

-- Update margin for existing records (margin = amount - expense)
UPDATE public.banking_accounts 
SET margin = amount - COALESCE(expense, 0);