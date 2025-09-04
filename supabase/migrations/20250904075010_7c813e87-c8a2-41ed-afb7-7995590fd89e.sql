-- Final RLS Security Fix - Enable RLS on any remaining unprotected tables

-- Double-check RLS is enabled on all public tables that might have been missed
ALTER TABLE public.od_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photostats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Ensure all tables have proper RLS policies (only create if not exists)
-- od_records policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'od_records_deny_anonymous_access' AND polrelid = 'public.od_records'::regclass) THEN
        CREATE POLICY "od_records_deny_anonymous_access" 
        ON public.od_records 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'od_records_authenticated_access' AND polrelid = 'public.od_records'::regclass) THEN
        CREATE POLICY "od_records_authenticated_access" 
        ON public.od_records 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- templates policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'templates_deny_anonymous_access' AND polrelid = 'public.templates'::regclass) THEN
        CREATE POLICY "templates_deny_anonymous_access" 
        ON public.templates 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'templates_authenticated_access' AND polrelid = 'public.templates'::regclass) THEN
        CREATE POLICY "templates_authenticated_access" 
        ON public.templates 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- classes policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'classes_deny_anonymous_access' AND polrelid = 'public.classes'::regclass) THEN
        CREATE POLICY "classes_deny_anonymous_access" 
        ON public.classes 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'classes_authenticated_access' AND polrelid = 'public.classes'::regclass) THEN
        CREATE POLICY "classes_authenticated_access" 
        ON public.classes 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- applications policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'applications_deny_anonymous_access' AND polrelid = 'public.applications'::regclass) THEN
        CREATE POLICY "applications_deny_anonymous_access" 
        ON public.applications 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'applications_authenticated_access' AND polrelid = 'public.applications'::regclass) THEN
        CREATE POLICY "applications_authenticated_access" 
        ON public.applications 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- schools policies  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'schools_deny_anonymous_access' AND polrelid = 'public.schools'::regclass) THEN
        CREATE POLICY "schools_deny_anonymous_access" 
        ON public.schools 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'schools_authenticated_access' AND polrelid = 'public.schools'::regclass) THEN
        CREATE POLICY "schools_authenticated_access" 
        ON public.schools 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- photostats policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'photostats_deny_anonymous_access' AND polrelid = 'public.photostats'::regclass) THEN
        CREATE POLICY "photostats_deny_anonymous_access" 
        ON public.photostats 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'photostats_authenticated_access' AND polrelid = 'public.photostats'::regclass) THEN
        CREATE POLICY "photostats_authenticated_access" 
        ON public.photostats 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- subjects policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'subjects_deny_anonymous_access' AND polrelid = 'public.subjects'::regclass) THEN
        CREATE POLICY "subjects_deny_anonymous_access" 
        ON public.subjects 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'subjects_authenticated_access' AND polrelid = 'public.subjects'::regclass) THEN
        CREATE POLICY "subjects_authenticated_access" 
        ON public.subjects 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- customer_transactions policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'customer_transactions_deny_anonymous_access' AND polrelid = 'public.customer_transactions'::regclass) THEN
        CREATE POLICY "customer_transactions_deny_anonymous_access" 
        ON public.customer_transactions 
        FOR ALL 
        TO anon
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'customer_transactions_authenticated_access' AND polrelid = 'public.customer_transactions'::regclass) THEN
        CREATE POLICY "customer_transactions_authenticated_access" 
        ON public.customer_transactions 
        FOR ALL 
        TO authenticated
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;