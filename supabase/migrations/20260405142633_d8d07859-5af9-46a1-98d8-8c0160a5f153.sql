
CREATE TABLE public.imps_electricity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone NOT NULL DEFAULT now(),
  record_type text NOT NULL DEFAULT 'IMPS',
  customer_name text NOT NULL,
  account_number text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  remarks text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.imps_electricity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage imps_electricity"
  ON public.imps_electricity
  FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Deny anonymous access to imps_electricity"
  ON public.imps_electricity
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER update_imps_electricity_updated_at
  BEFORE UPDATE ON public.imps_electricity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
