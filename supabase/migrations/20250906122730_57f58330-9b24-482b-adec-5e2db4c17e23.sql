-- Update RLS policies for role-based access control
-- This fixes the critical security issue where any authenticated user could access ALL business data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "banking_accounts_authenticated_access" ON public.banking_accounts;
DROP POLICY IF EXISTS "Authenticated users can manage pan_cards" ON public.pan_cards;
DROP POLICY IF EXISTS "Authenticated users can manage daily_needs" ON public.daily_needs;
DROP POLICY IF EXISTS "Authenticated users can manage passports" ON public.passports;
DROP POLICY IF EXISTS "khata_customers_authenticated_access" ON public.khata_customers;
DROP POLICY IF EXISTS "od_records_authenticated_access" ON public.od_records;
DROP POLICY IF EXISTS "templates_authenticated_access" ON public.templates;
DROP POLICY IF EXISTS "online_services_authenticated_access" ON public.online_services;
DROP POLICY IF EXISTS "Authenticated users can manage ledger_customers" ON public.ledger_customers;
DROP POLICY IF EXISTS "forms_authenticated_access" ON public.forms;
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can manage uploaded_documents" ON public.uploaded_documents;
DROP POLICY IF EXISTS "Authenticated users can manage fee_expenses" ON public.fee_expenses;
DROP POLICY IF EXISTS "Authenticated users can manage user_admin" ON public.user_admin;
DROP POLICY IF EXISTS "classes_authenticated_access" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "applications_authenticated_access" ON public.applications;
DROP POLICY IF EXISTS "schools_authenticated_access" ON public.schools;
DROP POLICY IF EXISTS "Authenticated users can manage banking_services" ON public.banking_services;
DROP POLICY IF EXISTS "photostats_authenticated_access" ON public.photostats;
DROP POLICY IF EXISTS "Authenticated users can manage misc_expenses" ON public.misc_expenses;
DROP POLICY IF EXISTS "Authenticated users can manage khata_transactions" ON public.khata_transactions;
DROP POLICY IF EXISTS "customer_transactions_authenticated_access" ON public.customer_transactions;
DROP POLICY IF EXISTS "pending_balances_authenticated_access" ON public.pending_balances;
DROP POLICY IF EXISTS "subjects_authenticated_access" ON public.subjects;

-- Banking accounts - Admin and Manager access only
CREATE POLICY "Admins and managers can manage banking accounts"
ON public.banking_accounts
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- PAN cards - Admin and Manager access only
CREATE POLICY "Admins and managers can manage pan cards"
ON public.pan_cards
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Daily needs - Admin and Manager access only
CREATE POLICY "Admins and managers can manage daily needs"
ON public.daily_needs
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Passports - Admin and Manager access only
CREATE POLICY "Admins and managers can manage passports"
ON public.passports
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Khata customers - Admin and Manager access only
CREATE POLICY "Admins and managers can manage khata customers"
ON public.khata_customers
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- OD records - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage od records"
ON public.od_records
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Templates - Admin and Manager access only
CREATE POLICY "Admins and managers can manage templates"
ON public.templates
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Online services - Admin and Manager access only
CREATE POLICY "Admins and managers can manage online services"
ON public.online_services
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Ledger customers - Admin and Manager access only (contains PII)
CREATE POLICY "Admins and managers can manage ledger customers"
ON public.ledger_customers
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Forms - Admin and Manager access only (contains PII)
CREATE POLICY "Admins and managers can manage forms"
ON public.forms
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Expenses - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Uploaded documents - Admin and Manager access only
CREATE POLICY "Admins and managers can manage uploaded documents"
ON public.uploaded_documents
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Fee expenses - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage fee expenses"
ON public.fee_expenses
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- User admin - Admin access only
CREATE POLICY "Admins can manage user admin data"
ON public.user_admin
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Classes - Admin and Manager access only
CREATE POLICY "Admins and managers can manage classes"
ON public.classes
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Customers - Admin and Manager access only (contains PII)
CREATE POLICY "Admins and managers can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Applications - Admin and Manager access only
CREATE POLICY "Admins and managers can manage applications"
ON public.applications
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Schools - Admin and Manager access only
CREATE POLICY "Admins and managers can manage schools"
ON public.schools
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Banking services - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage banking services"
ON public.banking_services
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Photostats - Admin and Manager access only
CREATE POLICY "Admins and managers can manage photostats"
ON public.photostats
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Misc expenses - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage misc expenses"
ON public.misc_expenses
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Khata transactions - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage khata transactions"
ON public.khata_transactions
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Customer transactions - Admin and Manager access only (financial data)
CREATE POLICY "Admins and managers can manage customer transactions"
ON public.customer_transactions
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Pending balances - Admin and Manager access only (contains PII and financial data)
CREATE POLICY "Admins and managers can manage pending balances"
ON public.pending_balances
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Subjects - Admin and Manager access only
CREATE POLICY "Admins and managers can manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Account details - Admin and Manager access only (contains sensitive PII)
-- Keep existing granular policies but update them for role-based access
DROP POLICY IF EXISTS "Authenticated users can create account details" ON public.account_details;
DROP POLICY IF EXISTS "Authenticated users can delete account details" ON public.account_details;
DROP POLICY IF EXISTS "Authenticated users can update account details" ON public.account_details;
DROP POLICY IF EXISTS "Authenticated users can view account details" ON public.account_details;

CREATE POLICY "Admins and managers can manage account details"
ON public.account_details
FOR ALL
TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());