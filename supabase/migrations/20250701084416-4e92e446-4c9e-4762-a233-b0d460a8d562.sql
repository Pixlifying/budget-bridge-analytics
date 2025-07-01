
-- Add the missing od_from_bank column to the od_records table
ALTER TABLE od_records ADD COLUMN IF NOT EXISTS od_from_bank NUMERIC DEFAULT 0;

-- Update the table to ensure all required columns exist with proper defaults
ALTER TABLE od_records ALTER COLUMN od_from_bank SET DEFAULT 0;
ALTER TABLE od_records ALTER COLUMN od_from_bank SET NOT NULL;
