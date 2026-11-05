BEGIN;

ALTER TABLE public.project_expenses
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS party_id uuid;

UPDATE public.project_expenses pe
SET company_id = p.company_id
FROM public.projects p
WHERE pe.project_id = p.id
  AND pe.company_id IS NULL;

ALTER TABLE public.project_expenses
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.project_expense_payments
  ADD COLUMN IF NOT EXISTS company_id uuid;

UPDATE public.project_expense_payments pep
SET company_id = pe.company_id
FROM public.project_expenses pe
WHERE pep.project_expense_id = pe.id
  AND pep.company_id IS NULL;

ALTER TABLE public.project_expense_payments
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.project_receipts
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid;

UPDATE public.project_receipts pr
SET company_id = p.company_id
FROM public.projects p
WHERE pr.project_id = p.id
  AND pr.company_id IS NULL;

ALTER TABLE public.project_receipts
  ALTER COLUMN company_id SET NOT NULL;

COMMIT;
