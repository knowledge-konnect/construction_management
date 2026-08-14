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
  name text NOT NULL,
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  gst_number text,
  pan_number text,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_settings_pkey PRIMARY KEY (company_id),
  CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  mobile text,
  email text,
  address text,
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
