BEGIN;

-- Allow neutral general-contact records while keeping the existing role flags
-- and company-scoped party model intact for customer/supplier/investor flows.
ALTER TABLE public.parties
  DROP CONSTRAINT IF EXISTS parties_has_role;

ALTER TABLE public.parties
  ADD CONSTRAINT parties_has_role CHECK (true);

COMMIT;
