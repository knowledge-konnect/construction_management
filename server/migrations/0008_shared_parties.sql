BEGIN;

CREATE TABLE public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'person' CHECK (entity_type IN ('person', 'business')),
  contact_person_name text,
  is_customer boolean NOT NULL DEFAULT false,
  is_supplier boolean NOT NULL DEFAULT false,
  is_investor boolean NOT NULL DEFAULT false,
  email text,
  mobile text,
  address text,
  city text,
  state text,
  pincode text,
  gstin text,
  gst_registration_type text,
  gst_state_code text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parties_has_role CHECK (
    is_customer OR is_supplier OR is_investor
  )
);

CREATE INDEX idx_parties_company_active_updated
  ON public.parties (company_id, is_active, updated_at DESC);

CREATE INDEX idx_parties_company_role_lookup
  ON public.parties (company_id, is_customer, is_supplier, is_investor);

CREATE INDEX idx_parties_company_search
  ON public.parties (company_id, name, email, mobile, gstin);

INSERT INTO public.parties (
  id, company_id, name, entity_type, contact_person_name,
  is_customer, is_supplier, is_investor,
  email, mobile, address, city, state, pincode,
  gstin, gst_registration_type, gst_state_code, notes,
  is_active, is_deleted, deleted_at, deleted_by,
  created_at, updated_at
)
SELECT
  c.id, c.company_id, c.name, 'person', NULL,
  true, false, false,
  c.email, c.mobile, c.address, c.city, c.state, c.pincode,
  c.gstin, c.gst_registration_type, c.gst_state_code, NULL,
  true, c.is_deleted, c.deleted_at, c.deleted_by,
  c.created_at, c.updated_at
FROM public.customers c
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.parties (
  id, company_id, name, entity_type, contact_person_name,
  is_customer, is_supplier, is_investor,
  email, mobile, address, city, state, pincode,
  gstin, gst_registration_type, gst_state_code, notes,
  is_active, is_deleted, deleted_at, deleted_by,
  created_at, updated_at
)
SELECT
  i.id, i.company_id, i.name, 'person', NULL,
  false, false, true,
  i.email, i.phone, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  true, false, NULL, NULL,
  now(), now()
FROM public.investors i
WHERE NOT EXISTS (
  SELECT 1 FROM public.parties p WHERE p.id = i.id
)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER set_parties_updated_at
BEFORE UPDATE ON public.parties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
