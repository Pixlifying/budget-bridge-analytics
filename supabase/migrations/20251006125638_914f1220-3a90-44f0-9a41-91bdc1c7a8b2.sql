-- Create milk_records table
CREATE TABLE IF NOT EXISTS public.milk_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  milk_amount NUMERIC NOT NULL CHECK (milk_amount >= 0),
  received BOOLEAN NOT NULL DEFAULT false,
  amount_per_litre NUMERIC NOT NULL CHECK (amount_per_litre >= 0),
  total NUMERIC GENERATED ALWAYS AS (milk_amount * amount_per_litre) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.milk_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and managers can manage milk records"
ON public.milk_records
FOR ALL
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

CREATE POLICY "milk_records_deny_anonymous_access"
ON public.milk_records
FOR ALL
USING (false)
WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER update_milk_records_updated_at
BEFORE UPDATE ON public.milk_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();