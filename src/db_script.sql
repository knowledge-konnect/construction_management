<<<<<<< HEAD
-- Synced from server/migrations after latest Supabase run.
-- Destructive reset is intentionally separate: server/migrations/0000_DESTRUCTIVE_reset_app_schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','owner','admin','staff')),
  is_active boolean NOT NULL DEFAULT true,
  email_verified boolean NOT NULL DEFAULT false,
  must_change_password boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  company_name text,
  avatar_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_address text
);

CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id),
=======
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
>>>>>>> origin/main
  name text NOT NULL,
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  gst_number text,
  pan_number text,
<<<<<<< HEAD
  primary_color text DEFAULT '#0B2857',
  secondary_color text DEFAULT '#F4B72B',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE TABLE public.company_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  quotation_prefix text NOT NULL DEFAULT 'QTN',
  booking_prefix text NOT NULL DEFAULT 'BR',
  default_validity_days integer NOT NULL DEFAULT 30 CHECK (default_validity_days > 0),
=======
  primary_color text DEFAULT '#0B2857'::text,
  secondary_color text DEFAULT '#F4B72B'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_owner_fk FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.company_settings (
  company_id uuid NOT NULL,
  quotation_prefix text DEFAULT 'QTN'::text,
  booking_prefix text DEFAULT 'BR'::text,
  default_validity_days integer DEFAULT 30,
>>>>>>> origin/main
  authorized_person text,
  designation text,
  signature_url text,
  bank_name text,
  account_name text,
  account_number text,
  ifsc text,
  branch text,
  upi_id text,
  default_terms text,
<<<<<<< HEAD
  default_tax_name text,
  default_tax_rate numeric(5,2) DEFAULT 0 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','admin','staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
=======
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_settings_pkey PRIMARY KEY (company_id),
  CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
>>>>>>> origin/main
  name text NOT NULL,
  mobile text,
  email text,
  address text,
<<<<<<< HEAD
  city text,
  state text,
  pincode text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, company_id)
);

CREATE TABLE public.project_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_types UNIQUE NULLS NOT DISTINCT (company_id, code)
);

CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_expense_categories UNIQUE NULLS NOT DISTINCT (company_id, code)
);

CREATE TABLE public.units_of_measure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  symbol text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_units_of_measure UNIQUE NULLS NOT DISTINCT (company_id, code)
);

CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment_methods UNIQUE NULLS NOT DISTINCT (company_id, code)
);

CREATE TABLE public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  rate_percentage numeric(5,2) NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100),
  effective_from date NOT NULL,
  effective_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT uq_tax_rates UNIQUE NULLS NOT DISTINCT (company_id, code, effective_from)
);

CREATE TABLE public.project_stage_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  project_type_id uuid REFERENCES public.project_types(id) ON DELETE CASCADE,
  template_code text NOT NULL,
  name text NOT NULL,
  sequence_number integer NOT NULL CHECK (sequence_number > 0),
  default_completion_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (default_completion_percentage >= 0 AND default_completion_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_stage_templates UNIQUE NULLS NOT DISTINCT (company_id, project_type_id, template_code)
);

CREATE TABLE public.document_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('Quotation','BookingReceipt')),
  financial_year integer NOT NULL,
  prefix text NOT NULL,
  next_number integer NOT NULL DEFAULT 1 CHECK (next_number > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document_type, financial_year)
);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id uuid,
  document_type text NOT NULL CHECK (document_type IN ('Quotation','BookingReceipt')),
  document_number text NOT NULL,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Generated','Sent','Accepted','Rejected','Expired','Completed','Cancelled')),
  quotation_date date,
  valid_until date,
  project_name text,
  project_location text,
  floors text,
  project_type_id uuid REFERENCES public.project_types(id) ON DELETE SET NULL,
  project_type text,
  builtup_area numeric(18,2),
  area_unit_id uuid REFERENCES public.units_of_measure(id) ON DELETE SET NULL,
  area_unit text,
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  additional_charges numeric(18,2) NOT NULL DEFAULT 0 CHECK (additional_charges >= 0),
  discount numeric(18,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax_rate_id uuid REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  tax_name text,
  tax_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  cgst_percentage numeric(5,2) DEFAULT 0 CHECK (cgst_percentage >= 0 AND cgst_percentage <= 100),
  sgst_percentage numeric(5,2) DEFAULT 0 CHECK (sgst_percentage >= 0 AND sgst_percentage <= 100),
  igst_percentage numeric(5,2) DEFAULT 0 CHECK (igst_percentage >= 0 AND igst_percentage <= 100),
  cgst_amount numeric(18,2) DEFAULT 0 CHECK (cgst_amount >= 0),
  sgst_amount numeric(18,2) DEFAULT 0 CHECK (sgst_amount >= 0),
  igst_amount numeric(18,2) DEFAULT 0 CHECK (igst_amount >= 0),
  tax_breakup jsonb,
  grand_total numeric(18,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.users(id),
  UNIQUE (company_id, document_number),
  UNIQUE (id, company_id),
  CONSTRAINT fk_documents_customer
    FOREIGN KEY (customer_id)
    REFERENCES public.customers(id)
    ON DELETE SET NULL
);

CREATE TABLE public.document_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE TABLE public.document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.document_sections(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_id uuid REFERENCES public.units_of_measure(id) ON DELETE SET NULL,
  unit text,
  rate numeric(18,2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE TABLE public.document_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  specification_type text,
  description text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE TABLE public.document_inclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL
);

CREATE TABLE public.document_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL
);

CREATE TABLE public.payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  percentage numeric(5,2),
  amount numeric(18,2),
  due_date date,
  status text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
  CHECK (amount IS NULL OR amount >= 0)
);

CREATE TABLE public.document_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE TABLE public.booking_receipt_details (
  document_id uuid PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  booking_id text,
  flat_no text,
  floor text,
  block_tower text,
  rate_per_sqft numeric(18,2),
  buyer_pan_aadhar text
);

CREATE TABLE public.company_subscriptions (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','paid')),
  billing_cycle text CHECK (billing_cycle IN ('monthly','yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_quotation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  usage_year integer NOT NULL CHECK (usage_year >= 2000),
  usage_month integer NOT NULL CHECK (usage_month BETWEEN 1 AND 12),
  quotation_count integer NOT NULL DEFAULT 0 CHECK (quotation_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, usage_year, usage_month)
);

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  customer_id uuid,
  source_document_id uuid,
  project_type_id uuid REFERENCES public.project_types(id) ON DELETE SET NULL,
  project_type_snapshot text,
  project_number text NOT NULL,
  name text NOT NULL,
  description text,
  site_address text,
  contract_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (contract_amount >= 0),
  start_date date,
  expected_end_date date,
  actual_end_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','on_hold','completed','cancelled')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (company_id, project_number),
  UNIQUE (id, company_id),
  CONSTRAINT fk_projects_customer
    FOREIGN KEY (customer_id)
    REFERENCES public.customers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_projects_source_document_company
    FOREIGN KEY (source_document_id, company_id)
    REFERENCES public.documents(id, company_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_projects_company_source_document
  ON public.projects(company_id, source_document_id)
  WHERE source_document_id IS NOT NULL;

CREATE TABLE public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  sequence_number integer NOT NULL DEFAULT 1 CHECK (sequence_number > 0),
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  completion_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','on_hold')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, sequence_number)
);

CREATE TABLE public.project_progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.project_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  progress_percentage numeric(5,2),
  update_date date NOT NULL DEFAULT CURRENT_DATE,
  visibility_status text NOT NULL DEFAULT 'draft' CHECK (visibility_status IN ('draft','published')),
  created_by uuid REFERENCES public.users(id),
  published_by uuid REFERENCES public.users(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (progress_percentage IS NULL OR (progress_percentage >= 0 AND progress_percentage <= 100))
);

CREATE TABLE public.project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category text NOT NULL,
  description text NOT NULL,
  supplier_name text,
  supplier_bill_number text,
  bill_date date,
  due_date date,
  bill_amount numeric(18,2) NOT NULL CHECK (bill_amount >= 0),
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','partially_paid','paid','void')),
  visibility_status text NOT NULL DEFAULT 'internal' CHECK (visibility_status IN ('internal','published')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz
);

CREATE TABLE public.project_expense_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_expense_id uuid NOT NULL REFERENCES public.project_expenses(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','upi','bank_transfer','cheque','other')),
  reference_number text,
  notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz
);

CREATE TABLE public.project_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','upi','bank_transfer','cheque','other')),
  reference_number text,
  notes text,
  visibility_status text NOT NULL DEFAULT 'internal' CHECK (visibility_status IN ('internal','published')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  UNIQUE (project_id, receipt_number)
);

CREATE TABLE public.project_client_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invitation_token_hash text,
  invitation_expires_at timestamptz,
  invitation_status text NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending','accepted','revoked','expired')),
  invited_by uuid REFERENCES public.users(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, email)
);

CREATE TABLE public.project_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  progress_update_id uuid REFERENCES public.project_progress_updates(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.project_expenses(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  visibility_status text NOT NULL DEFAULT 'internal' CHECK (visibility_status IN ('internal','published')),
  uploaded_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE public.project_investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  company_id uuid NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  investment_percentage numeric(5,2) CHECK (investment_percentage >= 0 AND investment_percentage <= 100),
  can_view_financials boolean NOT NULL DEFAULT false,
  can_approve_payments boolean NOT NULL DEFAULT false,
  can_view_client_receipts boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id),
  UNIQUE (project_id, email),
  UNIQUE (id, project_id, company_id),
  CONSTRAINT fk_project_investors_project_company
    FOREIGN KEY (project_id, company_id)
    REFERENCES public.projects(id, company_id)
    ON DELETE CASCADE
);

CREATE TABLE public.project_investor_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_investor_id uuid NOT NULL,
  project_id uuid NOT NULL,
  company_id uuid NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_investor_contribution_owner
    FOREIGN KEY (project_investor_id, project_id, company_id)
    REFERENCES public.project_investors(id, project_id, company_id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.validate_project_source_quotation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  src public.documents%ROWTYPE;
BEGIN
  IF NEW.source_document_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO src
  FROM public.documents
  WHERE id = NEW.source_document_id
    AND company_id = NEW.company_id
    AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'source_document_id not found in same company';
  END IF;

  IF src.document_type <> 'Quotation' THEN
    RAISE EXCEPTION 'source_document_id must reference document_type Quotation';
  END IF;

  IF src.status <> 'Accepted' THEN
    RAISE EXCEPTION 'Only Accepted quotation can be used for conversion';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_progress_stage_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  st_project uuid;
BEGIN
  IF NEW.stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT project_id INTO st_project
  FROM public.project_stages
  WHERE id = NEW.stage_id;

  IF st_project IS NULL OR st_project <> NEW.project_id THEN
    RAISE EXCEPTION 'stage_id must belong to same project_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_attachment_links()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  upd_project uuid;
  exp_project uuid;
BEGIN
  IF NEW.progress_update_id IS NOT NULL THEN
    SELECT project_id INTO upd_project
    FROM public.project_progress_updates
    WHERE id = NEW.progress_update_id;

    IF upd_project IS NULL OR upd_project <> NEW.project_id THEN
      RAISE EXCEPTION 'progress_update_id must belong to same project_id';
    END IF;
  END IF;

  IF NEW.expense_id IS NOT NULL THEN
    SELECT project_id INTO exp_project
    FROM public.project_expenses
    WHERE id = NEW.expense_id;

    IF exp_project IS NULL OR exp_project <> NEW.project_id THEN
      RAISE EXCEPTION 'expense_id must belong to same project_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_document_master_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ok_count integer;
BEGIN
  IF NEW.project_type_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.project_types
    WHERE id = NEW.project_type_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'project_type_id is not allowed for this company';
    END IF;
  END IF;

  IF NEW.area_unit_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.units_of_measure
    WHERE id = NEW.area_unit_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'area_unit_id is not allowed for this company';
    END IF;
  END IF;

  IF NEW.tax_rate_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.tax_rates
    WHERE id = NEW.tax_rate_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'tax_rate_id is not allowed for this company';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_document_customer_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  c_company uuid;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO c_company
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF c_company IS NULL OR c_company <> NEW.company_id THEN
    RAISE EXCEPTION 'documents.customer_id must belong to same company_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_project_master_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ok_count integer;
BEGIN
  IF NEW.project_type_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.project_types
    WHERE id = NEW.project_type_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'project_type_id is not allowed for this company';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_project_customer_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  c_company uuid;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO c_company
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF c_company IS NULL OR c_company <> NEW.company_id THEN
    RAISE EXCEPTION 'projects.customer_id must belong to same company_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_stage_template_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pt_company uuid;
BEGIN
  IF NEW.project_type_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO pt_company
  FROM public.project_types
  WHERE id = NEW.project_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_stage_templates.project_type_id not found';
  END IF;

  -- Global template must reference a global project type.
  IF NEW.company_id IS NULL AND pt_company IS NOT NULL THEN
    RAISE EXCEPTION 'global stage template cannot reference a company project type';
  END IF;

  -- Company template may reference its own type or a global type.
  IF NEW.company_id IS NOT NULL AND pt_company IS NOT NULL AND pt_company <> NEW.company_id THEN
    RAISE EXCEPTION 'company stage template cannot reference another company project type';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_expense_master_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  p_company uuid;
  ok_count integer;
BEGIN
  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO p_company
  FROM public.projects
  WHERE id = NEW.project_id;

  SELECT count(*) INTO ok_count
  FROM public.expense_categories
  WHERE id = NEW.category_id
    AND is_active = true
    AND (company_id = p_company OR company_id IS NULL);

  IF ok_count = 0 THEN
    RAISE EXCEPTION 'category_id is not allowed for this company';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_payment_method_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  p_company uuid;
  ok_count integer;
BEGIN
  IF TG_TABLE_NAME = 'project_receipts' THEN
    IF NEW.payment_method_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT company_id INTO p_company
    FROM public.projects
    WHERE id = NEW.project_id;
  ELSE
    IF NEW.payment_method_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT p.company_id INTO p_company
    FROM public.project_expenses e
    JOIN public.projects p ON p.id = e.project_id
    WHERE e.id = NEW.project_expense_id;
  END IF;

  SELECT count(*) INTO ok_count
  FROM public.payment_methods
  WHERE id = NEW.payment_method_id
    AND is_active = true
    AND (company_id = p_company OR company_id IS NULL);

  IF ok_count = 0 THEN
    RAISE EXCEPTION 'payment_method_id is not allowed for this company';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_document_item_unit_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  d_company uuid;
  ok_count integer;
BEGIN
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT d.company_id
  INTO d_company
  FROM public.document_sections s
  JOIN public.documents d ON d.id = s.document_id
  WHERE s.id = NEW.section_id;

  SELECT count(*) INTO ok_count
  FROM public.units_of_measure
  WHERE id = NEW.unit_id
    AND is_active = true
    AND (company_id = d_company OR company_id IS NULL);

  IF ok_count = 0 THEN
    RAISE EXCEPTION 'unit_id is not allowed for this document company';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_source_validation
  BEFORE INSERT OR UPDATE OF source_document_id, company_id
  ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_source_quotation();

CREATE TRIGGER trg_progress_stage_validation
  BEFORE INSERT OR UPDATE OF stage_id, project_id
  ON public.project_progress_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_progress_stage_link();

CREATE TRIGGER trg_attachment_link_validation
  BEFORE INSERT OR UPDATE OF progress_update_id, expense_id, project_id
  ON public.project_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attachment_links();

CREATE TRIGGER trg_documents_master_scope
  BEFORE INSERT OR UPDATE OF project_type_id, area_unit_id, tax_rate_id, company_id
  ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_document_master_scope();

CREATE TRIGGER trg_documents_customer_scope
  BEFORE INSERT OR UPDATE OF customer_id, company_id
  ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_document_customer_scope();

CREATE TRIGGER trg_projects_master_scope
  BEFORE INSERT OR UPDATE OF project_type_id, company_id
  ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_master_scope();

CREATE TRIGGER trg_projects_customer_scope
  BEFORE INSERT OR UPDATE OF customer_id, company_id
  ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_customer_scope();

CREATE TRIGGER trg_stage_templates_scope
  BEFORE INSERT OR UPDATE OF company_id, project_type_id
  ON public.project_stage_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stage_template_scope();

CREATE TRIGGER trg_expenses_master_scope
  BEFORE INSERT OR UPDATE OF category_id, project_id
  ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expense_master_scope();

CREATE TRIGGER trg_receipts_method_scope
  BEFORE INSERT OR UPDATE OF payment_method_id, project_id
  ON public.project_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_method_scope();

CREATE TRIGGER trg_expense_payments_method_scope
  BEFORE INSERT OR UPDATE OF payment_method_id, project_expense_id
  ON public.project_expense_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_method_scope();

CREATE TRIGGER trg_document_items_unit_scope
  BEFORE INSERT OR UPDATE OF unit_id, section_id
  ON public.document_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_document_item_unit_scope();

CREATE INDEX idx_documents_company_updated ON public.documents(company_id, updated_at DESC);
CREATE INDEX idx_documents_company_type_status ON public.documents(company_id, document_type, status);
CREATE INDEX idx_projects_company_updated ON public.projects(company_id, updated_at DESC);
CREATE INDEX idx_projects_company_status ON public.projects(company_id, status);
CREATE INDEX idx_project_expenses_project_bill_date ON public.project_expenses(project_id, bill_date DESC);
CREATE INDEX idx_project_receipts_project_received_date ON public.project_receipts(project_id, received_date DESC);
CREATE INDEX idx_project_stages_project_sequence ON public.project_stages(project_id, sequence_number);
CREATE INDEX idx_progress_updates_project_date ON public.project_progress_updates(project_id, update_date DESC);
CREATE INDEX idx_investor_contrib_investor_date ON public.project_investor_contributions(project_investor_id, contribution_date DESC);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_company_users_updated_at BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_project_types_updated_at BEFORE UPDATE ON public.project_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_units_updated_at BEFORE UPDATE ON public.units_of_measure FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tax_rates_updated_at BEFORE UPDATE ON public.tax_rates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stage_templates_updated_at BEFORE UPDATE ON public.project_stage_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_document_sequences_updated_at BEFORE UPDATE ON public.document_sequences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stages_updated_at BEFORE UPDATE ON public.project_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON public.project_progress_updates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.project_expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_receipts_updated_at BEFORE UPDATE ON public.project_receipts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_client_access_updated_at BEFORE UPDATE ON public.project_client_access FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_investors_updated_at BEFORE UPDATE ON public.project_investors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_company_subscriptions_updated_at BEFORE UPDATE ON public.company_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_company_usage_updated_at BEFORE UPDATE ON public.company_quotation_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subscription_payments_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;


-- =========================================================
-- Seed Data
-- =========================================================

BEGIN;

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES
  (NULL, 'individual_house', 'Individual House', 'Standalone houses', 1, true),
  (NULL, 'villa', 'Villa', 'Villa projects', 2, true),
  (NULL, 'apartment_building', 'Apartment Building', 'Apartment projects', 3, true),
  (NULL, 'commercial_building', 'Commercial Building', 'Commercial projects', 4, true),
  (NULL, 'renovation', 'Renovation', 'Renovation projects', 5, true),
  (NULL, 'extension', 'Extension / Additional Floor', 'Extension projects', 6, true),
  (NULL, 'interior', 'Interior Works', 'Interior works', 7, true),
  (NULL, 'civil_only', 'Civil Works Only', 'Civil-only projects', 8, true),
  (NULL, 'other', 'Other', 'Other type', 9, true)
ON CONFLICT ON CONSTRAINT uq_project_types
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.expense_categories (company_id, code, name, description, sort_order, is_active)
VALUES
  (NULL, 'materials', 'Materials', 'Construction materials', 1, true),
  (NULL, 'labour', 'Labour', 'Labour charges', 2, true),
  (NULL, 'equipment', 'Equipment', 'Equipment and machinery', 3, true),
  (NULL, 'transport', 'Transport', 'Transport and logistics', 4, true),
  (NULL, 'misc', 'Miscellaneous', 'Other expenses', 5, true)
ON CONFLICT ON CONSTRAINT uq_expense_categories
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.units_of_measure (company_id, code, name, symbol, sort_order, is_active)
VALUES
  (NULL, 'sqft', 'Sq.ft', 'Sq.ft', 1, true),
  (NULL, 'sqm', 'Sq.m', 'Sq.m', 2, true),
  (NULL, 'nos', 'Nos', 'Nos', 3, true),
  (NULL, 'kg', 'Kg', 'Kg', 4, true),
  (NULL, 'cft', 'Cft', 'Cft', 5, true),
  (NULL, 'rft', 'Rft', 'Rft', 6, true),
  (NULL, 'bag', 'Bag', 'Bag', 7, true),
  (NULL, 'litre', 'Litre', 'Litre', 8, true),
  (NULL, 'lumpsum', 'LS / Lump Sum', 'LS', 9, true),
  (NULL, 'job', 'Job', 'Job', 10, true)
ON CONFLICT ON CONSTRAINT uq_units_of_measure
DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.payment_methods (company_id, code, name, sort_order, is_active)
VALUES
  (NULL, 'cash', 'Cash', 1, true),
  (NULL, 'upi', 'UPI', 2, true),
  (NULL, 'bank_transfer', 'Bank Transfer', 3, true),
  (NULL, 'cheque', 'Cheque', 4, true),
  (NULL, 'other', 'Other', 5, true)
ON CONFLICT ON CONSTRAINT uq_payment_methods
DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.tax_rates (company_id, code, name, rate_percentage, effective_from, effective_to, is_active)
VALUES
  (NULL, 'gst_0', 'GST 0%', 0.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_5', 'GST 5%', 5.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_12', 'GST 12%', 12.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_18', 'GST 18%', 18.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_28', 'GST 28%', 28.00, DATE '2024-01-01', NULL, true)
ON CONFLICT ON CONSTRAINT uq_tax_rates
DO UPDATE SET
  name = EXCLUDED.name,
  rate_percentage = EXCLUDED.rate_percentage,
  effective_to = EXCLUDED.effective_to,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.project_stage_templates (company_id, project_type_id, template_code, name, sequence_number, default_completion_percentage, is_active)
SELECT
  NULL,
  pt.id,
  t.template_code,
  t.name,
  t.sequence_number,
  t.default_completion_percentage,
  true
FROM public.project_types pt
JOIN (
  VALUES
    ('individual_house', 'site_setup', 'Site Setup', 1, 5.00),
    ('individual_house', 'foundation', 'Foundation', 2, 20.00),
    ('individual_house', 'structure', 'RCC / Structure', 3, 45.00),
    ('individual_house', 'masonry', 'Masonry', 4, 60.00),
    ('individual_house', 'plastering', 'Plastering', 5, 70.00),
    ('individual_house', 'flooring', 'Flooring', 6, 80.00),
    ('individual_house', 'electrical_plumbing', 'Electrical & Plumbing', 7, 90.00),
    ('individual_house', 'painting', 'Painting', 8, 96.00),
    ('individual_house', 'handover', 'Handover', 9, 100.00)
) AS t(project_code, template_code, name, sequence_number, default_completion_percentage)
  ON pt.company_id IS NULL AND pt.code = t.project_code
ON CONFLICT ON CONSTRAINT uq_project_stage_templates
DO UPDATE SET
  name = EXCLUDED.name,
  sequence_number = EXCLUDED.sequence_number,
  default_completion_percentage = EXCLUDED.default_completion_percentage,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;

=======
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  city text,
  state text,
  pincode text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT customers_company_fk FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  customer_id uuid,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['Quotation'::text, 'BookingReceipt'::text])),
  document_number text NOT NULL,
  status text NOT NULL DEFAULT 'Draft'::text CHECK (status = ANY (ARRAY['Draft'::text, 'Completed'::text, 'Cancelled'::text])),
  quotation_date date,
  valid_until date,
  project_name text,
  project_type text,
  project_location text,
  builtup_area numeric,
  area_unit text,
  floors text,
  subtotal numeric DEFAULT 0,
  additional_charges numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT documents_company_fk FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.document_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  section_name text NOT NULL,
  display_order integer DEFAULT 0,
  CONSTRAINT document_sections_pkey PRIMARY KEY (id),
  CONSTRAINT document_sections_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 0,
  unit text,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  display_order integer DEFAULT 0,
  CONSTRAINT document_items_pkey PRIMARY KEY (id),
  CONSTRAINT document_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.document_sections(id)
);
CREATE TABLE public.document_specifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  specification_type text,
  description text,
  display_order integer DEFAULT 0,
  CONSTRAINT document_specifications_pkey PRIMARY KEY (id),
  CONSTRAINT document_specifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_inclusions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  description text NOT NULL,
  CONSTRAINT document_inclusions_pkey PRIMARY KEY (id),
  CONSTRAINT document_inclusions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_exclusions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  description text NOT NULL,
  CONSTRAINT document_exclusions_pkey PRIMARY KEY (id),
  CONSTRAINT document_exclusions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  stage_name text NOT NULL,
  percentage numeric,
  amount numeric,
  due_date date,
  status text,
  display_order integer DEFAULT 0,
  CONSTRAINT payment_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT payment_schedules_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  description text NOT NULL,
  display_order integer DEFAULT 0,
  CONSTRAINT document_terms_pkey PRIMARY KEY (id),
  CONSTRAINT document_terms_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user'::text,
  is_active boolean NOT NULL DEFAULT true,
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  phone text,
  company_name text,
  avatar_url text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  user_agent text,
  ip_address text,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.password_resets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  CONSTRAINT password_resets_pkey PRIMARY KEY (id),
  CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
>>>>>>> origin/main
