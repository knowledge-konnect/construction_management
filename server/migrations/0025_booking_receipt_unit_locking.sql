BEGIN;

ALTER TABLE public.booking_receipt_details
  ADD COLUMN IF NOT EXISTS project_unit_id uuid,
  ADD COLUMN IF NOT EXISTS booking_status text,
  ADD COLUMN IF NOT EXISTS prior_unit_status text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_booking_receipt_details_project_unit'
      AND conrelid = 'public.booking_receipt_details'::regclass
  ) THEN
    ALTER TABLE public.booking_receipt_details
      ADD CONSTRAINT fk_booking_receipt_details_project_unit
      FOREIGN KEY (project_unit_id)
      REFERENCES public.project_units(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE public.booking_receipt_details
  ADD CONSTRAINT chk_booking_receipt_details_booking_status
  CHECK (
    booking_status IS NULL OR booking_status IN ('Draft', 'Confirmed', 'Cancelled', 'Completed')
  );

ALTER TABLE public.booking_receipt_details
  ADD CONSTRAINT chk_booking_receipt_details_prior_unit_status
  CHECK (
    prior_unit_status IS NULL OR prior_unit_status IN ('available', 'allocated', 'booked')
  );

-- Backfill only where the historical state is explicit and safe to infer.
-- We intentionally do not reference documents.is_deleted in the unique index below,
-- because soft delete lives on the parent document row and the correct enforcement is
-- transactional app-side validation plus the active-booking partial unique index.
UPDATE public.booking_receipt_details brd
SET booking_status = CASE
  WHEN d.status = 'Cancelled' THEN 'Cancelled'
  WHEN d.status = 'Completed' THEN 'Completed'
  WHEN d.status IN ('Accepted', 'Generated', 'Sent') THEN 'Confirmed'
  WHEN d.is_deleted = true THEN 'Cancelled'
  ELSE 'Draft'
END
FROM public.documents d
WHERE brd.document_id = d.id
  AND brd.booking_status IS NULL
  AND d.status IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_active_booking_per_unit
  ON public.booking_receipt_details (project_unit_id)
  WHERE project_unit_id IS NOT NULL
    AND booking_status IN ('Confirmed', 'Completed');

CREATE OR REPLACE FUNCTION public.confirm_booking_receipt_unit(
  p_document_id uuid,
  p_project_unit_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_document record;
  v_unit record;
  v_active_booking_count integer;
BEGIN
  SELECT d.id, d.company_id, d.project_id, d.is_deleted, d.status
    INTO v_document
  FROM public.documents d
  WHERE d.id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking document not found.';
  END IF;

  IF v_document.is_deleted THEN
    RAISE EXCEPTION 'This receipt has been deleted and can no longer be modified.';
  END IF;

  SELECT pu.id, pu.company_id, pu.project_id, pu.status
    INTO v_unit
  FROM public.project_units pu
  WHERE pu.id = p_project_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected project unit was not found.';
  END IF;

  IF v_unit.company_id <> v_document.company_id THEN
    RAISE EXCEPTION 'Selected unit does not belong to this company.';
  END IF;

  IF v_unit.project_id <> v_document.project_id THEN
    RAISE EXCEPTION 'Selected unit does not belong to this project.';
  END IF;

  IF v_unit.status NOT IN ('available', 'allocated') THEN
    RAISE EXCEPTION 'This unit is not available for booking.';
  END IF;

  SELECT count(*)
    INTO v_active_booking_count
  FROM public.booking_receipt_details brd
  JOIN public.documents d ON d.id = brd.document_id
  WHERE brd.project_unit_id = p_project_unit_id
    AND brd.booking_status IN ('Confirmed', 'Completed')
    AND brd.document_id <> p_document_id
    AND d.is_deleted = false;

  IF v_active_booking_count > 0 THEN
    RAISE EXCEPTION 'This unit already has an active booking.';
  END IF;

  UPDATE public.booking_receipt_details
  SET project_unit_id = p_project_unit_id,
      booking_status = 'Confirmed',
      prior_unit_status = v_unit.status
  WHERE document_id = p_document_id;

  UPDATE public.project_units
  SET status = 'booked',
      updated_at = now()
  WHERE id = p_project_unit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking_receipt_unit(
  p_document_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking record;
  v_unit record;
BEGIN
  SELECT brd.document_id, brd.project_unit_id, brd.booking_status, brd.prior_unit_status, d.company_id, d.project_id, d.is_deleted
    INTO v_booking
  FROM public.booking_receipt_details brd
  JOIN public.documents d ON d.id = brd.document_id
  WHERE brd.document_id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking document not found.';
  END IF;

  IF v_booking.is_deleted THEN
    RAISE EXCEPTION 'This receipt has been deleted and can no longer be modified.';
  END IF;

  IF v_booking.project_unit_id IS NULL THEN
    UPDATE public.booking_receipt_details
    SET booking_status = 'Cancelled'
    WHERE document_id = p_document_id;
    RETURN;
  END IF;

  SELECT pu.status, pu.company_id, pu.project_id
    INTO v_unit
  FROM public.project_units pu
  WHERE pu.id = v_booking.project_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit linked to this booking no longer exists.';
  END IF;

  UPDATE public.booking_receipt_details
  SET booking_status = 'Cancelled'
  WHERE document_id = p_document_id;

  IF v_unit.status = 'booked' THEN
    UPDATE public.project_units
    SET status = COALESCE(v_booking.prior_unit_status, 'available'),
        updated_at = now()
    WHERE id = v_booking.project_unit_id;
  END IF;
END;
$$;

COMMIT;
