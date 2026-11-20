-- 0022_quotation_save_and_pdf_support.sql
--
-- What this migration does
--   1. Persists data the quotation PDF needs but the database was silently dropping:
--        discount type (a 10% discount used to reload as Rs.10), the questionnaire,
--        payment-stage notes, individual additional-charge lines, internal notes,
--        validity text, and the order of inclusions/exclusions.
--   2. Adds documents.row_type-style support for text-only BOQ rows
--        (document_items.row_type = 'item' | 'note') so engineer's notes are no longer
--        stored as "Qty 0 / Rs.0" line items.
--   3. Adds documents.brand_snapshot: the company's logo/colors/address/bank details frozen
--        when a quotation leaves Draft, so a later rebrand never changes a quotation
--        that was already issued.
--   4. Adds documents.version for optimistic concurrency (two autosaves can no longer
--        silently overwrite each other).
--   5. Adds allocate_document_number() and save_quotation(): the whole save — number
--        allocation, totals, document row and every child table — runs in ONE
--        transaction. A failure rolls everything back (no half-saved BOQ, no burned
--        document number). Totals are recomputed here; client-sent totals are ignored.
--
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE throughout). Rollback: 0022_rollback.sql.

BEGIN;

-- ─── 1. documents ────────────────────────────────────────────────────────────────

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS version                 integer      NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS discount_type           text         NOT NULL DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS discount_amount         numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_charge_items jsonb        NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS questionnaire           jsonb,
  ADD COLUMN IF NOT EXISTS internal_notes          text,
  ADD COLUMN IF NOT EXISTS validity                text,
  ADD COLUMN IF NOT EXISTS brand_snapshot          jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_discount_type_check') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_discount_type_check
      CHECK (discount_type IN ('None', 'Percentage', 'Fixed Amount'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_discount_amount_check') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_discount_amount_check CHECK (discount_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_version_check') THEN
    ALTER TABLE public.documents ADD CONSTRAINT documents_version_check CHECK (version >= 1);
  END IF;
END $$;

-- Backfill the discount type for existing quotations. Until now only the raw value was
-- stored, so "10" could mean 10% or Rs.10. grand_total was computed from the true
-- interpretation, so pick whichever one reproduces it; fall back to Fixed Amount (which
-- is what the app assumed on reload).
WITH calc AS (
  SELECT d.id,
         d.discount,
         (d.subtotal + d.additional_charges)                                         AS base,
         (1 + d.tax_percentage / 100)                                                AS tax_mult,
         d.grand_total
  FROM public.documents d
  WHERE d.document_type = 'Quotation' AND d.discount > 0 AND d.discount_type = 'None'
), decided AS (
  SELECT id, discount, base,
         CASE
           WHEN abs(grand_total - round((base - base * discount / 100) * tax_mult, 2)) < 0.02
            AND abs(grand_total - round((base - discount) * tax_mult, 2)) >= 0.02
           THEN 'Percentage'
           ELSE 'Fixed Amount'
         END AS dtype
  FROM calc
)
UPDATE public.documents d
SET discount_type   = x.dtype,
    discount_amount = CASE x.dtype
                        WHEN 'Percentage' THEN round(x.base * x.discount / 100, 2)
                        ELSE x.discount
                      END
FROM decided x
WHERE d.id = x.id;

-- Non-quotation documents (booking receipts): a stored discount is a plain amount.
UPDATE public.documents
SET discount_type = 'Fixed Amount', discount_amount = discount
WHERE document_type <> 'Quotation' AND discount > 0 AND discount_type = 'None';

-- Existing quotations: keep what the app showed before (additional charges as one line).
UPDATE public.documents
SET additional_charge_items = jsonb_build_array(
      jsonb_build_object('id', 'additional-1', 'description', 'Additional charges', 'amount', additional_charges))
WHERE additional_charges > 0 AND additional_charge_items = '[]'::jsonb;

-- ─── 2. child tables ─────────────────────────────────────────────────────────────

ALTER TABLE public.document_items
  ADD COLUMN IF NOT EXISTS row_type text NOT NULL DEFAULT 'item';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_items_row_type_check') THEN
    ALTER TABLE public.document_items
      ADD CONSTRAINT document_items_row_type_check CHECK (row_type IN ('item', 'note'));
  END IF;
END $$;

-- A row with no quantity and no rate adds nothing to any total: it is a text note.
UPDATE public.document_items
SET row_type = 'note'
WHERE row_type = 'item' AND quantity = 0 AND rate = 0;

ALTER TABLE public.payment_schedules ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.document_inclusions ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.document_exclusions ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Best-effort order for existing rows: physical (insertion) order within each document.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY document_id ORDER BY ctid) - 1 AS rn
  FROM public.document_inclusions
)
UPDATE public.document_inclusions t SET display_order = r.rn FROM ranked r WHERE t.id = r.id AND t.display_order = 0;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY document_id ORDER BY ctid) - 1 AS rn
  FROM public.document_exclusions
)
UPDATE public.document_exclusions t SET display_order = r.rn FROM ranked r WHERE t.id = r.id AND t.display_order = 0;

-- ─── 3. document numbering (atomic, inside the caller's transaction) ─────────────

CREATE OR REPLACE FUNCTION public.allocate_document_number(p_company_id uuid, p_document_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_local  timestamp := (now() AT TIME ZONE 'Asia/Kolkata');
  v_fy     integer;
  v_prefix text;
  v_used   text;
  v_next   integer;
BEGIN
  IF p_document_type NOT IN ('Quotation', 'BookingReceipt') THEN
    RAISE EXCEPTION 'Unsupported document type %', p_document_type USING ERRCODE = '22023';
  END IF;

  -- Indian financial year (Apr-Mar), stored as its starting calendar year.
  v_fy := CASE WHEN extract(month FROM v_local) >= 4
               THEN extract(year FROM v_local)::integer
               ELSE extract(year FROM v_local)::integer - 1 END;

  SELECT CASE WHEN p_document_type = 'BookingReceipt'
              THEN COALESCE(NULLIF(s.booking_prefix, ''), 'BR')
              ELSE COALESCE(NULLIF(s.quotation_prefix, ''), 'QTN') END
    INTO v_prefix
  FROM public.company_settings s WHERE s.company_id = p_company_id;

  v_prefix := COALESCE(v_prefix, CASE WHEN p_document_type = 'BookingReceipt' THEN 'BR' ELSE 'QTN' END);

  -- First use of a (company, type, year) takes number 1 and leaves next_number = 2;
  -- afterwards every call atomically bumps it. A rolled-back caller gives the number back.
  INSERT INTO public.document_sequences AS ds (company_id, document_type, financial_year, prefix, next_number)
  VALUES (p_company_id, p_document_type, v_fy, v_prefix, 2)
  ON CONFLICT (company_id, document_type, financial_year)
  DO UPDATE SET next_number = ds.next_number + 1, updated_at = now()
  RETURNING ds.prefix, ds.next_number - 1 INTO v_used, v_next;

  RETURN v_used || '/' || v_fy::text || '/' || lpad(v_next::text, 3, '0');
END;
$$;

-- ─── 4. save_quotation: one transaction for the whole save ───────────────────────
--
-- p_payload (snake_case, built by server/src/quotationPayload.ts):
--   id, customer_id, party_id, status, quotation_date, valid_until,
--   project_type_id, project_name, project_type, project_location, area_unit_id,
--   builtup_area, area_unit, floors, tax_rate_id, tax_name, tax_applicable, tax_percentage,
--   discount_type, discount_value, additional_charge_items[{id,description,amount}],
--   notes, internal_notes, validity, questionnaire{},
--   sections[{id,section_name,display_order,items[{id,description,quantity,unit_id,unit,
--             rate,display_order,row_type}]}],
--   specifications[{id,specification_type,description,display_order}],
--   inclusions[text], exclusions[text],
--   payment_schedule[{id,stage_name,percentage,amount,due_date,status,notes,display_order}],
--   terms[{id,description,display_order}]
--
-- Errors (SQLSTATE): 42501 other company's document · 40001 version conflict ·
--   P0409 deleted document · 22023 invalid input (bad discount, >100% payments, ...)

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

  -- Serialise concurrent saves of the same quotation.
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

  -- ── Totals: always recomputed here; whatever the client sent is ignored ──────────
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

  -- ── Brand snapshot: frozen when the quotation leaves Draft ───────────────────────
  IF v_status = 'Draft' THEN
    v_brand := NULL;                                   -- editing again: re-snapshot on next issue
  ELSIF NOT v_is_new AND v_existing.brand_snapshot IS NOT NULL THEN
    v_brand := v_existing.brand_snapshot;              -- already issued: never changes
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

  -- ── Document row ─────────────────────────────────────────────────────────────────
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

  -- ── Children: replace the full set ───────────────────────────────────────────────
  DELETE FROM public.document_sections       WHERE document_id = v_id;   -- cascades to document_items
  DELETE FROM public.document_terms          WHERE document_id = v_id;
  DELETE FROM public.document_specifications WHERE document_id = v_id;
  DELETE FROM public.document_inclusions     WHERE document_id = v_id;
  DELETE FROM public.document_exclusions     WHERE document_id = v_id;
  DELETE FROM public.payment_schedules       WHERE document_id = v_id;

  v_sec_ord := 0;
  FOR v_section IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) LOOP
    -- A client-supplied id that already exists (a cloned quotation reusing ids) gets a fresh one.
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

  INSERT INTO public.payment_schedules (id, document_id, stage_name, percentage, amount, due_date, status, notes, display_order)
  SELECT CASE WHEN NULLIF(e.p->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.payment_schedules x WHERE x.id = (e.p->>'id')::uuid)
             THEN (e.p->>'id')::uuid ELSE gen_random_uuid() END, v_id,
         e.p->>'stage_name',
         NULLIF(e.p->>'percentage', '')::numeric,
         CASE WHEN NULLIF(e.p->>'percentage', '') IS NOT NULL
              THEN round(v_grand * (e.p->>'percentage')::numeric / 100, 2)
              ELSE NULLIF(e.p->>'amount', '')::numeric END,
         NULLIF(e.p->>'due_date', '')::date,
         NULLIF(e.p->>'status', ''),
         NULLIF(e.p->>'notes', ''),
         COALESCE(NULLIF(e.p->>'display_order', '')::integer, (e.ord - 1)::integer)
  FROM jsonb_array_elements(COALESCE(p_payload->'payment_schedule', '[]'::jsonb)) WITH ORDINALITY AS e(p, ord);

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

-- Only the backend (service role) may call these. Supabase grants EXECUTE on new functions
-- to anon/authenticated by default, so revoke explicitly.
REVOKE ALL ON FUNCTION public.allocate_document_number(uuid, text)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_quotation(uuid, jsonb, integer)         FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.allocate_document_number(uuid, text)     TO service_role;
GRANT  EXECUTE ON FUNCTION public.save_quotation(uuid, jsonb, integer)     TO service_role;

COMMIT;
