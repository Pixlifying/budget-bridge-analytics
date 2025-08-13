-- Create daily_needs table for storing daily requirements and expenses
CREATE TABLE public.daily_needs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'pieces', 'litres')),
  price_per_unit NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_needs ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_needs
CREATE POLICY "Allow all operations on daily_needs" 
ON public.daily_needs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_needs_updated_at
BEFORE UPDATE ON public.daily_needs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance on date queries
CREATE INDEX idx_daily_needs_date ON public.daily_needs(date);
CREATE INDEX idx_daily_needs_created_at ON public.daily_needs(created_at);