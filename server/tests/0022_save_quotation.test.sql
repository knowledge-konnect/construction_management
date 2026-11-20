-- Behavioural tests for 0022. Run against a scratch database:
--   psql -d <scratch_db> -v ON_ERROR_STOP=1 -f server/tests/0022_save_quotation.test.sql
-- Everything runs inside a transaction that is rolled back at the end.
BEGIN;
SET client_min_messages = notice;

DO $$
DECLARE
  u uuid; c1 uuid; c2 uuid;
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  r jsonb; r2 jsonb; payload jsonb; n int;
  v_next_before int; v_next_after int; v_code text; v_ok boolean;
  sec_a uuid := gen_random_uuid(); sec_b uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.users (email, password_hash) VALUES ('t-' || gen_random_uuid() || '@x.com', 'x') RETURNING id INTO u;
  INSERT INTO public.companies (owner_id, name, primary_color, secondary_color, logo_url, address, phone)
    VALUES (u, 'Test Builders', '#0F766E', '#F97316', 'https://x/logo.png', 'Vizag', '999') RETURNING id INTO c1;
  INSERT INTO public.companies (owner_id, name) VALUES (u, 'Other Co') RETURNING id INTO c2;
  INSERT INTO public.company_settings (company_id, quotation_prefix) VALUES (c1, 'DOC/QTN');

  payload := jsonb_build_object(
    'id', q1, 'status', 'Draft', 'quotation_date', '2026-11-09', 'valid_until', '2026-12-09',
    'project_name', 'Home', 'tax_applicable', true, 'tax_name', 'GST', 'tax_percentage', 5,
    'discount_type', 'Percentage', 'discount_value', 10,
    'grand_total', 1,                                   -- bogus client total must be ignored
    'additional_charge_items', jsonb_build_array(jsonb_build_object('id','a1','description','Site visit','amount',0)),
    'questionnaire', jsonb_build_object('cementBrand', 'UltraTech'),
    'sections', jsonb_build_array(
      jsonb_build_object('id', sec_a, 'section_name', 'Earthwork', 'display_order', 0, 'items', jsonb_build_array(
        jsonb_build_object('description', 'Pit excavation', 'quantity', 15, 'rate', 3000, 'unit', 'Nos', 'display_order', 0))),
      jsonb_build_object('id', sec_b, 'section_name', 'Steel', 'display_order', 1, 'items', jsonb_build_array(
        jsonb_build_object('description', 'Follow GFC drawings', 'quantity', 0, 'rate', 0, 'unit', 'Nos', 'display_order', 0),
        jsonb_build_object('description', 'PCC', 'quantity', 1450, 'rate', 135, 'unit', 'Sq.ft', 'display_order', 1)))),
    'inclusions', jsonb_build_array('Site setup', 'Foundation', 'Masonry'),
    'exclusions', jsonb_build_array('Borewell', 'Lift'),
    'payment_schedule', jsonb_build_array(
      jsonb_build_object('stage_name', 'Advance', 'percentage', 50, 'notes', 'On agreement', 'display_order', 0),
      jsonb_build_object('stage_name', 'Handover', 'percentage', 50, 'display_order', 1)),
    'terms', jsonb_build_array(jsonb_build_object('description', 'Valid 30 days', 'display_order', 0)));

  -- 1. create: totals recomputed server-side, number allocated, version 1
  r := public.save_quotation(c1, payload);
  IF (r->>'subtotal')::numeric <> 240750 THEN RAISE EXCEPTION 'subtotal %', r->>'subtotal'; END IF;
  IF (r->>'discount_amount')::numeric <> 24075 THEN RAISE EXCEPTION 'discount %', r->>'discount_amount'; END IF;
  IF (r->>'tax_amount')::numeric <> 10833.75 THEN RAISE EXCEPTION 'tax %', r->>'tax_amount'; END IF;
  IF (r->>'grand_total')::numeric <> 227508.75 THEN RAISE EXCEPTION 'grand %', r->>'grand_total'; END IF;
  IF (r->>'version')::int <> 1 OR NOT (r->>'is_new')::boolean THEN RAISE EXCEPTION 'version/is_new %', r; END IF;
  IF r->>'document_number' !~ '^DOC/QTN/20[0-9]{2}/001$' THEN RAISE EXCEPTION 'number %', r->>'document_number'; END IF;
  RAISE NOTICE 'PASS 1  create: totals ignore client value, number %', r->>'document_number';

  -- 2. discount TYPE survives (the old bug reloaded 10%% as Rs.10)
  IF (SELECT discount_type || ':' || discount FROM public.documents WHERE id = q1) <> 'Percentage:10.00' THEN
    RAISE EXCEPTION 'discount not persisted'; END IF;
  RAISE NOTICE 'PASS 2  discount type + value persisted';

  -- 3. note row detected, section/item order and extra data persisted
  IF (SELECT row_type FROM public.document_items WHERE description = 'Follow GFC drawings') <> 'note' THEN
    RAISE EXCEPTION 'note row not detected'; END IF;
  IF (SELECT string_agg(description, ',' ORDER BY display_order) FROM public.document_inclusions WHERE document_id = q1) <> 'Site setup,Foundation,Masonry' THEN
    RAISE EXCEPTION 'inclusion order'; END IF;
  IF (SELECT notes FROM public.payment_schedules WHERE document_id = q1 AND stage_name = 'Advance') <> 'On agreement' THEN
    RAISE EXCEPTION 'payment notes lost'; END IF;
  IF (SELECT amount FROM public.payment_schedules WHERE document_id = q1 AND stage_name = 'Advance') <> 113754.38 THEN
    RAISE EXCEPTION 'payment amount %', (SELECT amount FROM public.payment_schedules WHERE document_id = q1 AND stage_name = 'Advance'); END IF;
  IF (SELECT questionnaire->>'cementBrand' FROM public.documents WHERE id = q1) <> 'UltraTech' THEN
    RAISE EXCEPTION 'questionnaire lost'; END IF;
  RAISE NOTICE 'PASS 3  note row, ordering, payment notes/amounts, questionnaire persisted';

  -- 4. Draft has no brand snapshot; issuing freezes one; later rebrand does not change it
  IF (SELECT brand_snapshot FROM public.documents WHERE id = q1) IS NOT NULL THEN RAISE EXCEPTION 'draft has snapshot'; END IF;
  r2 := public.save_quotation(c1, payload || jsonb_build_object('status', 'Generated'), 1);
  IF (r2->>'version')::int <> 2 OR r2->>'document_number' <> r->>'document_number' THEN RAISE EXCEPTION 'update %', r2; END IF;
  IF (SELECT brand_snapshot->>'primaryColor' FROM public.documents WHERE id = q1) <> '#0F766E' THEN RAISE EXCEPTION 'no snapshot'; END IF;
  UPDATE public.companies SET primary_color = '#000000', name = 'Renamed' WHERE id = c1;
  PERFORM public.save_quotation(c1, payload || jsonb_build_object('status', 'Sent'), 2);
  IF (SELECT brand_snapshot->>'primaryColor' || '/' || (brand_snapshot->>'companyName') FROM public.documents WHERE id = q1) <> '#0F766E/Test Builders' THEN
    RAISE EXCEPTION 'snapshot changed after rebrand'; END IF;
  RAISE NOTICE 'PASS 4  brand snapshot frozen at issue, survives rebrand';

  -- 5. optimistic concurrency
  v_ok := false;
  BEGIN
    PERFORM public.save_quotation(c1, payload, 1);       -- stale (current is 3)
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE; v_ok := (v_code = '40001'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'stale version not rejected'; END IF;
  RAISE NOTICE 'PASS 5  stale version rejected (40001)';

  -- 6. atomic: a failing save changes NOTHING (bad item -> CHECK violation)
  SELECT count(*) INTO n FROM public.document_items i JOIN public.document_sections s ON s.id = i.section_id WHERE s.document_id = q1;
  v_ok := false;
  BEGIN
    PERFORM public.save_quotation(c1, jsonb_set(payload, '{sections,0,items,0,quantity}', '-5'::jsonb));
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  -- (this call was not wrapped in a subtransaction savepoint by the caller; the BEGIN/EXCEPTION block above is one)
  IF NOT v_ok THEN RAISE EXCEPTION 'bad payload accepted'; END IF;
  IF (SELECT count(*) FROM public.document_items i JOIN public.document_sections s ON s.id = i.section_id WHERE s.document_id = q1) <> n THEN
    RAISE EXCEPTION 'items changed after failed save'; END IF;
  IF (SELECT version FROM public.documents WHERE id = q1) <> 3 THEN RAISE EXCEPTION 'version moved after failed save'; END IF;
  RAISE NOTICE 'PASS 6  failed save rolled back (items and version untouched)';

  -- 7. failed NEW quotation does not burn a document number
  SELECT next_number INTO v_next_before FROM public.document_sequences WHERE company_id = c1 AND document_type = 'Quotation';
  v_ok := false;
  BEGIN
    PERFORM public.save_quotation(c1, jsonb_set(payload || jsonb_build_object('id', q2), '{sections,0,items,0,quantity}', '-5'::jsonb));
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  SELECT next_number INTO v_next_after FROM public.document_sequences WHERE company_id = c1 AND document_type = 'Quotation';
  IF NOT v_ok OR v_next_before <> v_next_after OR EXISTS (SELECT 1 FROM public.documents WHERE id = q2) THEN
    RAISE EXCEPTION 'failed new quotation left traces (before %, after %)', v_next_before, v_next_after; END IF;
  r := public.save_quotation(c1, payload || jsonb_build_object('id', q2));
  IF r->>'document_number' !~ '/002$' THEN RAISE EXCEPTION 'expected /002, got %', r->>'document_number'; END IF;
  RAISE NOTICE 'PASS 7  no number gap after a failed save (next is %)', r->>'document_number';

  -- 8. other company cannot touch it; invalid input is rejected
  v_ok := false;
  BEGIN PERFORM public.save_quotation(c2, payload);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE; v_ok := (v_code = '42501'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cross-company save allowed'; END IF;
  v_ok := false;
  BEGIN PERFORM public.save_quotation(c1, payload || jsonb_build_object('id', gen_random_uuid(), 'discount_type', 'Fixed Amount', 'discount_value', 99999999));
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE; v_ok := (v_code = '22023'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'oversized discount accepted'; END IF;
  v_ok := false;
  BEGIN PERFORM public.save_quotation(c1, jsonb_set(payload || jsonb_build_object('id', gen_random_uuid()), '{payment_schedule,0,percentage}', '80'));
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE; v_ok := (v_code = '22023'); END;
  IF NOT v_ok THEN RAISE EXCEPTION '>100%% payments accepted'; END IF;
  RAISE NOTICE 'PASS 8  cross-company blocked; bad discount and >100%% payment schedule rejected';

  -- 9. soft-deleted quotation cannot be modified
  UPDATE public.documents SET is_deleted = true WHERE id = q2;
  v_ok := false;
  BEGIN PERFORM public.save_quotation(c1, payload || jsonb_build_object('id', q2));
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE; v_ok := (v_code = 'P0409'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'deleted quotation modified'; END IF;
  RAISE NOTICE 'PASS 9  deleted quotation protected (P0409)';

  RAISE NOTICE 'ALL TESTS PASSED';
END $$;

ROLLBACK;
