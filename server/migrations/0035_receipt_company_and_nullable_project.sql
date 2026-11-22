BEGIN;

ALTER TABLE public.project_receipts
  ALTER COLUMN project_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid;

UPDATE public.project_receipts pr
SET company_id = p.company_id
FROM public.projects p
WHERE pr.project_id = p.id
  AND pr.company_id IS NULL;

ALTER TABLE public.project_receipts
  ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_project_receipts_customer'
      AND conrelid = 'public.project_receipts'::regclass
  ) THEN
    ALTER TABLE public.project_receipts
      ADD CONSTRAINT fk_project_receipts_customer
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
