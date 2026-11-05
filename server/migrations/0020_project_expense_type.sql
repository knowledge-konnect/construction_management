BEGIN;

ALTER TABLE public.project_expenses
  ADD COLUMN IF NOT EXISTS expense_type text;

DO $$
DECLARE
  has_supplier_id boolean;
  has_party_id boolean;
  supplier_condition text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_expenses'
      AND column_name = 'supplier_id'
  ) INTO has_supplier_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_expenses'
      AND column_name = 'party_id'
  ) INTO has_party_id;

  supplier_condition :=
    '(supplier_name IS NOT NULL AND btrim(supplier_name) <> '''')'
    || ' OR (supplier_bill_number IS NOT NULL AND btrim(supplier_bill_number) <> '''')'
    || ' OR due_date IS NOT NULL';

  IF has_supplier_id THEN
    supplier_condition := supplier_condition || ' OR supplier_id IS NOT NULL';
  END IF;

  IF has_party_id THEN
    supplier_condition := supplier_condition || ' OR party_id IS NOT NULL';
  END IF;

  EXECUTE format(
    'UPDATE public.project_expenses
     SET expense_type = CASE
       WHEN %s THEN ''supplier_bill''
       ELSE ''direct''
     END
     WHERE expense_type IS NULL',
    supplier_condition
  );
END $$;

ALTER TABLE public.project_expenses
  ALTER COLUMN expense_type SET DEFAULT 'direct';

UPDATE public.project_expenses
SET expense_type = 'direct'
WHERE expense_type IS NULL;

ALTER TABLE public.project_expenses
  ALTER COLUMN expense_type SET NOT NULL;

ALTER TABLE public.project_expenses
  DROP CONSTRAINT IF EXISTS project_expenses_expense_type_check;

ALTER TABLE public.project_expenses
  ADD CONSTRAINT project_expenses_expense_type_check
  CHECK (expense_type IN ('direct', 'supplier_bill'));

CREATE INDEX IF NOT EXISTS idx_project_expenses_company_expense_type
  ON public.project_expenses (company_id, expense_type);

CREATE INDEX IF NOT EXISTS idx_project_expenses_project_expense_type
  ON public.project_expenses (project_id, expense_type);

COMMIT;
