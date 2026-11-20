BEGIN;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS discount_amount numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_discount_amount_check'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_discount_amount_check CHECK (discount_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_discount_percentage_check'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_discount_percentage_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
  END IF;
END $$;

COMMIT;
