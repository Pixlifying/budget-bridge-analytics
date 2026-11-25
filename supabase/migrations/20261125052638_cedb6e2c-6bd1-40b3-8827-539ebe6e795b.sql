CREATE TABLE public.ckyc_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  account_number text NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  mobile_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ckyc_records TO authenticated;
GRANT ALL ON public.ckyc_records TO service_role;
ALTER TABLE public.ckyc_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and managers can manage CKYC records"
  ON public.ckyc_records
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));
CREATE INDEX ckyc_records_record_date_idx ON public.ckyc_records (record_date DESC);
CREATE TRIGGER update_ckyc_records_updated_at
  BEFORE UPDATE ON public.ckyc_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();