
CREATE TABLE public.work_to_be (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  name text NOT NULL,
  mobile text,
  service_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.work_to_be ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage work_to_be"
  ON public.work_to_be FOR ALL TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "work_to_be_deny_anonymous_access"
  ON public.work_to_be FOR ALL TO anon
  USING (false)
  WITH CHECK (false);
