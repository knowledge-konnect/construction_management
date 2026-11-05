BEGIN;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS party_id uuid
  REFERENCES public.parties(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS party_id uuid
  REFERENCES public.parties(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_company_party_unique
  ON public.customers (company_id, party_id)
  WHERE party_id IS NOT NULL;

COMMIT;
