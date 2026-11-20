-- Targeted test for 0023's payment-schedule rounding fix.
BEGIN;
DO $$
DECLARE
  u uuid; c uuid; q uuid := gen_random_uuid();
  r jsonb; total numeric; sec uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.users (email, password_hash) VALUES ('t-' || gen_random_uuid() || '@x.com', 'x') RETURNING id INTO u;
  INSERT INTO public.companies (owner_id, name) VALUES (u, 'Rounding Co') RETURNING id INTO c;

  -- Grand total 227508.75 (same figure from the bug report), split 50/50 — the case
  -- that used to produce 113754.38 + 113754.38 = 227508.76 (1 paisa too much).
  r := public.save_quotation(c, jsonb_build_object(
    'id', q, 'status', 'Draft', 'tax_applicable', true, 'tax_percentage', 5,
    'discount_type', 'Percentage', 'discount_value', 10,
    'sections', jsonb_build_array(jsonb_build_object('id', sec, 'section_name', 'Work', 'items', jsonb_build_array(
      jsonb_build_object('description', 'Item', 'quantity', 1, 'rate', 240750)))),  -- -> grand_total 227508.75, see migration 0022 test 1 for the same base
    'payment_schedule', jsonb_build_array(
      jsonb_build_object('stage_name', 'A', 'percentage', 50, 'display_order', 0),
      jsonb_build_object('stage_name', 'B', 'percentage', 50, 'display_order', 1))));
  IF (r->>'grand_total')::numeric <> 227508.75 THEN RAISE EXCEPTION 'unexpected grand_total %, fixture drifted', r->>'grand_total'; END IF;

  SELECT sum(amount) INTO total FROM public.payment_schedules WHERE document_id = q;
  IF total <> (r->>'grand_total')::numeric THEN
    RAISE EXCEPTION 'payment schedule (%) does not reconcile to grand_total (%)', total, r->>'grand_total';
  END IF;
  RAISE NOTICE 'PASS  50/50 split reconciles exactly: % + % = %',
    (SELECT amount FROM public.payment_schedules WHERE document_id=q AND stage_name='A'),
    (SELECT amount FROM public.payment_schedules WHERE document_id=q AND stage_name='B'), total;

  -- Three-way split (33.33/33.33/33.34-ish) — the classic rounding stress case.
  UPDATE public.documents SET version = 1 WHERE id = q; -- allow a second save in this test
  r := public.save_quotation(c, jsonb_build_object(
    'id', q, 'status', 'Draft', 'tax_applicable', true, 'tax_percentage', 5,
    'discount_type', 'Percentage', 'discount_value', 10,
    'sections', jsonb_build_array(jsonb_build_object('id', sec, 'section_name', 'Work', 'items', jsonb_build_array(
      jsonb_build_object('description', 'Item', 'quantity', 1, 'rate', 240750)))),
    'payment_schedule', jsonb_build_array(
      jsonb_build_object('stage_name', 'A', 'percentage', 33.33, 'display_order', 0),
      jsonb_build_object('stage_name', 'B', 'percentage', 33.33, 'display_order', 1),
      jsonb_build_object('stage_name', 'C', 'percentage', 33.34, 'display_order', 2))), 1);
  SELECT sum(amount) INTO total FROM public.payment_schedules WHERE document_id = q;
  IF total <> round((r->>'grand_total')::numeric * 100.00 / 100, 2) THEN
    RAISE EXCEPTION 'three-way split (%) does not reconcile', total;
  END IF;
  RAISE NOTICE 'PASS  three-way 33.33/33.33/33.34 split reconciles exactly: total %', total;

  -- Mixed: one percentage stage + one explicit-amount stage — the amount stage must be
  -- left completely untouched by the reconciliation.
  UPDATE public.documents SET version = 2 WHERE id = q;
  r := public.save_quotation(c, jsonb_build_object(
    'id', q, 'status', 'Draft', 'tax_applicable', true, 'tax_percentage', 5,
    'discount_type', 'Percentage', 'discount_value', 10,
    'sections', jsonb_build_array(jsonb_build_object('id', sec, 'section_name', 'Work', 'items', jsonb_build_array(
      jsonb_build_object('description', 'Item', 'quantity', 1, 'rate', 240750)))),
    'payment_schedule', jsonb_build_array(
      jsonb_build_object('stage_name', 'Advance', 'percentage', 50, 'display_order', 0),
      jsonb_build_object('stage_name', 'Fixed extra', 'amount', 500, 'display_order', 1))), 2);
  IF (SELECT amount FROM public.payment_schedules WHERE document_id=q AND stage_name='Fixed extra') <> 500 THEN
    RAISE EXCEPTION 'explicit-amount stage was altered';
  END IF;
  RAISE NOTICE 'PASS  explicit-amount stage untouched by reconciliation';

  RAISE NOTICE 'ALL 0023 TESTS PASSED';
END $$;
ROLLBACK;
