-- 0023_payment_schedule_rounding.sql
--
-- Fixes a rounding edge case in save_quotation (0022): each percentage-based payment
-- stage's amount was computed independently as round(grand_total * pct / 100, 2). For a
-- grand total of Rs.2,27,508.75 split 50/50, that gives Rs.1,13,754.38 + Rs.1,13,754.38
-- = Rs.2,27,508.76 — one paisa more than the actual total, because each half rounds up
-- independently. The fix: round every percentage-based stage normally EXCEPT the last
-- one (by display order), which gets "whatever's left" — total_pct% of grand_total minus
-- the sum of the other stages' rounded amounts — so percentage-based stages always sum
-- to exactly round(total_pct * grand_total / 100, 2), never off by a paisa. A stage
-- given an explicit amount (not a percentage) is untouched either way.
--
-- This REPLACES save_quotation's payment_schedules insert only; every other part of the
-- function (totals, sections, brand snapshot, version check, ...) is identical to 0022.
-- Safe to re-run. Rollback: 0023_rollback.sql (restores the exact 0022 behavior).

BEGIN;

CREATE OR REPLACE FUNCTION public.save_quotation(
  p_company_id       uuid,
  p_payload          jsonb,
  p_expected_version integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id        uuid := NULLIF(p_payload->>'id', '')::uuid;
  v_existing  public.documents%ROWTYPE;
  v_is_new    boolean;
  v_number    text;
  v_status    text := COALESCE(NULLIF(p_payload->>'status', ''), 'Draft');

  v_sub       numeric(18,2);
  v_add       numeric(18,2);
  v_base      numeric(18,2);
  v_dtype     text := COALESCE(NULLIF(p_payload->>'discount_type', ''), 'None');
  v_dval      numeric(18,2) := COALESCE(NULLIF(p_payload->>'discount_value', '')::numeric, 0);
  v_damt      numeric(18,2);
  v_tax_on    boolean := COALESCE((p_payload->>'tax_applicable')::boolean, false);
  v_tax_rate  numeric(5,2) := COALESCE(NULLIF(p_payload->>'tax_percentage', '')::numeric, 0);
  v_taxable   numeric(18,2);
  v_tax       numeric(18,2);
  v_grand     numeric(18,2);
  v_pay_pct   numeric;

  v_brand     jsonb;
  v_version   integer;
  v_section   jsonb;
  v_sec_id    uuid;
  v_sec_ord   integer;
  v_new_id    uuid;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Quotation id is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing FROM public.documents WHERE id = v_id FOR UPDATE;
  v_is_new := NOT FOUND;

  IF NOT v_is_new THEN
    IF v_existing.company_id <> p_company_id THEN
      RAISE EXCEPTION 'This document belongs to a different company.' USING ERRCODE = '42501';
    END IF;
    IF v_existing.document_type <> 'Quotation' THEN
      RAISE EXCEPTION 'This document is not a quotation.' USING ERRCODE = '22023';
    END IF;
    IF v_existing.is_deleted THEN
      RAISE EXCEPTION 'This quotation has been deleted and can no longer be modified.' USING ERRCODE = 'P0409';
    END IF;
    IF p_expected_version IS NOT NULL AND v_existing.version <> p_expected_version THEN
      RAISE EXCEPTION 'This quotation was changed elsewhere. Reload it before saving.'
        USING ERRCODE = '40001', DETAIL = format('current_version=%s', v_existing.version);
    END IF;
    v_number := v_existing.document_number;
  ELSE
    v_number := public.allocate_document_number(p_company_id, 'Quotation');
  END IF;

  SELECT COALESCE(SUM(round(COALESCE(NULLIF(i->>'quantity', '')::numeric, 0)
                          * COALESCE(NULLIF(i->>'rate', '')::numeric, 0), 2)), 0)
    INTO v_sub
  FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) s,
       jsonb_array_elements(COALESCE(s->'items', '[]'::jsonb)) i
  WHERE COALESCE(i->>'row_type', 'item') = 'item';

  SELECT COALESCE(SUM(round(COALESCE(NULLIF(c->>'amount', '')::numeric, 0), 2)), 0)
    INTO v_add
  FROM jsonb_array_elements(COALESCE(p_payload->'additional_charge_items', '[]'::jsonb)) c;

  IF v_dtype NOT IN ('None', 'Percentage', 'Fixed Amount') THEN
    RAISE EXCEPTION 'Invalid discount type: %', v_dtype USING ERRCODE = '22023';
  END IF;
  IF v_dval < 0 OR (v_dtype = 'Percentage' AND v_dval > 100) THEN
    RAISE EXCEPTION 'Invalid discount value.' USING ERRCODE = '22023';
  END IF;

  v_base := v_sub + v_add;
  v_damt := CASE v_dtype
              WHEN 'Percentage'   THEN round(v_base * v_dval / 100, 2)
              WHEN 'Fixed Amount' THEN round(v_dval, 2)
              ELSE 0 END;
  IF v_dtype = 'None' THEN v_dval := 0; END IF;
  IF v_damt > v_base THEN
    RAISE EXCEPTION 'Discount amount cannot exceed subtotal.' USING ERRCODE = '22023';
  END IF;

  v_taxable := v_base - v_damt;
  IF NOT v_tax_on THEN v_tax_rate := 0; END IF;
  v_tax   := CASE WHEN v_tax_rate > 0 THEN round(v_taxable * v_tax_rate / 100, 2) ELSE 0 END;
  v_grand := v_taxable + v_tax;

  SELECT COALESCE(SUM(NULLIF(p->>'percentage', '')::numeric), 0)
    INTO v_pay_pct
  FROM jsonb_array_elements(COALESCE(p_payload->'payment_schedule', '[]'::jsonb)) p;
  IF v_pay_pct > 100.0001 THEN
    RAISE EXCEPTION 'Payment schedule adds up to more than 100%%.' USING ERRCODE = '22023';
  END IF;

  IF v_status = 'Draft' THEN
    v_brand := NULL;
  ELSIF NOT v_is_new AND v_existing.brand_snapshot IS NOT NULL THEN
    v_brand := v_existing.brand_snapshot;
  ELSE
    SELECT jsonb_strip_nulls(jsonb_build_object(
             'companyName', c.name,         'logoUrl', c.logo_url,
             'primaryColor', c.primary_color, 'secondaryColor', c.secondary_color,
             'address', c.address,          'mobile', c.phone,
             'email', c.email,              'website', c.website,
             'gstin', c.gst_number,         'pan', c.pan_number,
             'bankName', s.bank_name,       'accountName', s.account_name,
             'accountNumber', s.account_number, 'ifsc', s.ifsc,
             'branch', s.branch,            'upiId', s.upi_id,
             'authorizedPersonName', s.authorized_person, 'designation', s.designation,
             'signatureImage', s.signature_url,
             'snapshotAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))
      INTO v_brand
    FROM public.companies c
    LEFT JOIN public.company_settings s ON s.company_id = c.id
    WHERE c.id = p_company_id;
  END IF;

  INSERT INTO public.documents AS d (
    id, company_id, customer_id, party_id, document_type, document_number, status,
    quotation_date, valid_until, project_type_id, project_name, project_type, project_location,
    area_unit_id, builtup_area, area_unit, floors,
    subtotal, additional_charges, discount, discount_type, discount_amount,
    tax_rate_id, tax_name, tax_percentage, tax_amount, grand_total,
    notes, internal_notes, validity, questionnaire, additional_charge_items, brand_snapshot,
    version, created_at, updated_at
  ) VALUES (
    v_id, p_company_id, NULLIF(p_payload->>'customer_id', '')::uuid, NULLIF(p_payload->>'party_id', '')::uuid,
    'Quotation', v_number, v_status,
    NULLIF(p_payload->>'quotation_date', '')::date, NULLIF(p_payload->>'valid_until', '')::date,
    NULLIF(p_payload->>'project_type_id', '')::uuid,
    COALESCE(p_payload->>'project_name', ''), COALESCE(p_payload->>'project_type', ''),
    COALESCE(p_payload->>'project_location', ''),
    NULLIF(p_payload->>'area_unit_id', '')::uuid, NULLIF(p_payload->>'builtup_area', '')::numeric,
    COALESCE(p_payload->>'area_unit', ''), COALESCE(p_payload->>'floors', ''),
    v_sub, v_add, v_dval, v_dtype, v_damt,
    NULLIF(p_payload->>'tax_rate_id', '')::uuid, NULLIF(p_payload->>'tax_name', ''), v_tax_rate, v_tax, v_grand,
    COALESCE(p_payload->>'notes', ''), COALESCE(p_payload->>'internal_notes', ''),
    NULLIF(p_payload->>'validity', ''),
    CASE WHEN jsonb_typeof(p_payload->'questionnaire') = 'object' THEN p_payload->'questionnaire' END,
    COALESCE(p_payload->'additional_charge_items', '[]'::jsonb), v_brand,
    1, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id, party_id = EXCLUDED.party_id, status = EXCLUDED.status,
    quotation_date = EXCLUDED.quotation_date, valid_until = EXCLUDED.valid_until,
    project_type_id = EXCLUDED.project_type_id, project_name = EXCLUDED.project_name,
    project_type = EXCLUDED.project_type, project_location = EXCLUDED.project_location,
    area_unit_id = EXCLUDED.area_unit_id, builtup_area = EXCLUDED.builtup_area,
    area_unit = EXCLUDED.area_unit, floors = EXCLUDED.floors,
    subtotal = EXCLUDED.subtotal, additional_charges = EXCLUDED.additional_charges,
    discount = EXCLUDED.discount, discount_type = EXCLUDED.discount_type,
    discount_amount = EXCLUDED.discount_amount,
    tax_rate_id = EXCLUDED.tax_rate_id, tax_name = EXCLUDED.tax_name,
    tax_percentage = EXCLUDED.tax_percentage, tax_amount = EXCLUDED.tax_amount,
    grand_total = EXCLUDED.grand_total, notes = EXCLUDED.notes,
    internal_notes = EXCLUDED.internal_notes, validity = EXCLUDED.validity,
    questionnaire = EXCLUDED.questionnaire, additional_charge_items = EXCLUDED.additional_charge_items,
    brand_snapshot = EXCLUDED.brand_snapshot,
    version = d.version + 1, updated_at = now()
  RETURNING d.version INTO v_version;

  DELETE FROM public.document_sections       WHERE document_id = v_id;
  DELETE FROM public.document_terms          WHERE document_id = v_id;
  DELETE FROM public.document_specifications WHERE document_id = v_id;
  DELETE FROM public.document_inclusions     WHERE document_id = v_id;
  DELETE FROM public.document_exclusions     WHERE document_id = v_id;
  DELETE FROM public.payment_schedules       WHERE document_id = v_id;

  v_sec_ord := 0;
  FOR v_section IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) LOOP
    v_new_id := NULLIF(v_section->>'id', '')::uuid;
    IF v_new_id IS NULL OR EXISTS (SELECT 1 FROM public.document_sections WHERE id = v_new_id) THEN
      v_new_id := gen_random_uuid();
    END IF;

    INSERT INTO public.document_sections (id, document_id, section_name, display_order)
    VALUES (
      v_new_id,
      v_id,
      v_section->>'section_name',
      COALESCE(NULLIF(v_section->>'display_order', '')::integer, v_sec_ord)
    )
    RETURNING id INTO v_sec_id;

    INSERT INTO public.document_items (id, section_id, description, quantity, unit_id, unit, rate, amount, display_order, row_type)
    SELECT CASE WHEN NULLIF(t.i->>'id', '') IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM public.document_items x WHERE x.id = (t.i->>'id')::uuid)
                THEN (t.i->>'id')::uuid ELSE gen_random_uuid() END,
           v_sec_id,
           t.i->>'description',
           t.qty,
           NULLIF(t.i->>'unit_id', '')::uuid,
           NULLIF(t.i->>'unit', ''),
           t.rate,
           CASE WHEN t.rtype = 'item' THEN round(t.qty * t.rate, 2) ELSE 0 END,
           COALESCE(NULLIF(t.i->>'display_order', '')::integer, (t.ord - 1)::integer),
           t.rtype
    FROM (
      SELECT i, ord,
             COALESCE(NULLIF(i->>'quantity', '')::numeric, 0) AS qty,
             COALESCE(NULLIF(i->>'rate', '')::numeric, 0)     AS rate,
             CASE
               WHEN i->>'row_type' IN ('item', 'note') THEN i->>'row_type'
               WHEN COALESCE(NULLIF(i->>'quantity', '')::numeric, 0) = 0
                AND COALESCE(NULLIF(i->>'rate', '')::numeric, 0) = 0 THEN 'note'
               ELSE 'item'
             END AS rtype
      FROM jsonb_array_elements(COALESCE(v_section->'items', '[]'::jsonb)) WITH ORDINALITY AS e(i, ord)
    ) t;

    v_sec_ord := v_sec_ord + 1;
  END LOOP;

  INSERT INTO public.document_specifications (id, document_id, specification_type, description, display_order)
  SELECT CASE WHEN NULLIF(e.s->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.document_specifications x WHERE x.id = (e.s->>'id')::uuid)
             THEN (e.s->>'id')::uuid ELSE gen_random_uuid() END, v_id,
         e.s->>'specification_type', e.s->>'description',
         COALESCE(NULLIF(e.s->>'display_order', '')::integer, (e.ord - 1)::integer)
  FROM jsonb_array_elements(COALESCE(p_payload->'specifications', '[]'::jsonb)) WITH ORDINALITY AS e(s, ord);

  INSERT INTO public.document_inclusions (document_id, description, display_order)
  SELECT v_id, btrim(e.txt), (e.ord - 1)::integer
  FROM jsonb_array_elements_text(COALESCE(p_payload->'inclusions', '[]'::jsonb)) WITH ORDINALITY AS e(txt, ord)
  WHERE btrim(e.txt) <> '';

  INSERT INTO public.document_exclusions (document_id, description, display_order)
  SELECT v_id, btrim(e.txt), (e.ord - 1)::integer
  FROM jsonb_array_elements_text(COALESCE(p_payload->'exclusions', '[]'::jsonb)) WITH ORDINALITY AS e(txt, ord)
  WHERE btrim(e.txt) <> '';

  -- Payment schedule: every percentage-based stage is rounded normally EXCEPT the last
  -- one (by display order among percentage-based stages), which absorbs whatever
  -- rounding residue is left so the set always sums to exactly
  -- round(total_pct * grand_total / 100, 2) — never off by a paisa from independent
  -- per-row rounding. A stage given an explicit amount (no percentage) passes through
  -- untouched; it isn't part of this reconciliation.
  WITH schedule AS (
    SELECT e.p, e.ord, NULLIF(e.p->>'percentage', '')::numeric AS pct
    FROM jsonb_array_elements(COALESCE(p_payload->'payment_schedule', '[]'::jsonb)) WITH ORDINALITY AS e(p, ord)
  ), pct_rows AS (
    SELECT ord, pct, round(v_grand * pct / 100, 2) AS naive_amount,
           row_number() OVER (ORDER BY ord DESC) AS rn_from_end
    FROM schedule WHERE pct IS NOT NULL
  ), pct_totals AS (
    SELECT COALESCE(SUM(pct), 0) AS total_pct,
           COALESCE(SUM(naive_amount) FILTER (WHERE rn_from_end <> 1), 0) AS sum_of_others
    FROM pct_rows
  )
  INSERT INTO public.payment_schedules (id, document_id, stage_name, percentage, amount, due_date, status, notes, display_order)
  SELECT CASE WHEN NULLIF(s.p->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.payment_schedules x WHERE x.id = (s.p->>'id')::uuid)
             THEN (s.p->>'id')::uuid ELSE gen_random_uuid() END,
         v_id,
         s.p->>'stage_name',
         s.pct,
         CASE
           WHEN s.pct IS NULL THEN NULLIF(s.p->>'amount', '')::numeric
           WHEN pr.rn_from_end = 1 THEN round(v_grand * t.total_pct / 100, 2) - t.sum_of_others
           ELSE pr.naive_amount
         END,
         NULLIF(s.p->>'due_date', '')::date,
         NULLIF(s.p->>'status', ''),
         NULLIF(s.p->>'notes', ''),
         COALESCE(NULLIF(s.p->>'display_order', '')::integer, (s.ord - 1)::integer)
  FROM schedule s
  LEFT JOIN pct_rows pr ON pr.ord = s.ord
  CROSS JOIN pct_totals t
  ORDER BY s.ord;

  INSERT INTO public.document_terms (id, document_id, description, display_order)
  SELECT CASE WHEN NULLIF(e.t->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.document_terms x WHERE x.id = (e.t->>'id')::uuid)
             THEN (e.t->>'id')::uuid ELSE gen_random_uuid() END, v_id,
         e.t->>'description',
         COALESCE(NULLIF(e.t->>'display_order', '')::integer, (e.ord - 1)::integer)
  FROM jsonb_array_elements(COALESCE(p_payload->'terms', '[]'::jsonb)) WITH ORDINALITY AS e(t, ord);

  RETURN jsonb_build_object(
    'id', v_id,
    'document_number', v_number,
    'version', v_version,
    'is_new', v_is_new,
    'subtotal', v_sub,
    'additional_charges', v_add,
    'discount_amount', v_damt,
    'taxable_amount', v_taxable,
    'tax_amount', v_tax,
    'grand_total', v_grand
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_quotation(uuid, jsonb, integer)         FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_quotation(uuid, jsonb, integer)     TO service_role;

COMMIT;
