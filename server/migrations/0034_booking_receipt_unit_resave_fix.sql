BEGIN;

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

  IF NOT FOUND THEN RAISE EXCEPTION 'Booking document not found.'; END IF;
  IF v_document.is_deleted THEN RAISE EXCEPTION 'This receipt has been deleted and can no longer be modified.'; END IF;

  SELECT pu.id, pu.company_id, pu.project_id, pu.status
    INTO v_unit
  FROM public.project_units pu
  WHERE pu.id = p_project_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Selected project unit was not found.'; END IF;
  IF v_unit.company_id <> v_document.company_id THEN RAISE EXCEPTION 'Selected unit does not belong to this company.'; END IF;
  IF v_unit.project_id <> v_document.project_id THEN RAISE EXCEPTION 'Selected unit does not belong to this project.'; END IF;

  IF v_unit.status = 'booked' THEN
    SELECT count(*) INTO v_active_booking_count
    FROM public.booking_receipt_details brd
    JOIN public.documents d ON d.id = brd.document_id
    WHERE brd.project_unit_id = p_project_unit_id
      AND brd.booking_status IN ('Confirmed', 'Completed')
      AND brd.document_id <> p_document_id
      AND d.is_deleted = false;

    IF v_active_booking_count > 0 THEN RAISE EXCEPTION 'This unit already has an active booking.'; END IF;
  ELSIF v_unit.status NOT IN ('available', 'allocated') THEN
    RAISE EXCEPTION 'This unit is not available for booking.';
  END IF;

  UPDATE public.booking_receipt_details
  SET project_unit_id = p_project_unit_id,
      booking_status = 'Confirmed',
      prior_unit_status = CASE WHEN v_unit.status = 'booked' THEN COALESCE(prior_unit_status, 'available') ELSE v_unit.status END
  WHERE document_id = p_document_id;

  UPDATE public.project_units
  SET status = 'booked', updated_at = now()
  WHERE id = p_project_unit_id;
END;
$$;

COMMIT;
