BEGIN;

ALTER TABLE public.booking_receipt_details
  ADD COLUMN IF NOT EXISTS agreement_value numeric(18,2),
  ADD COLUMN IF NOT EXISTS balance_due numeric(18,2),
  ADD COLUMN IF NOT EXISTS payment_mode text,
  ADD COLUMN IF NOT EXISTS due_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_booking_receipt_details_payment_mode'
      AND conrelid = 'public.booking_receipt_details'::regclass
  ) THEN
    ALTER TABLE public.booking_receipt_details
      ADD CONSTRAINT chk_booking_receipt_details_payment_mode
      CHECK (payment_mode IS NULL OR payment_mode IN ('Cash', 'Cheque', 'UPI', 'NEFT / RTGS', 'Bank Transfer'));
  END IF;
END $$;

COMMIT;
