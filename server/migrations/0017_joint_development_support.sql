BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS development_arrangement text,
  ADD COLUMN IF NOT EXISTS total_project_flats integer,
  ADD COLUMN IF NOT EXISTS landowner_party_id uuid,
  ADD COLUMN IF NOT EXISTS jda_agreement_reference text,
  ADD COLUMN IF NOT EXISTS jda_agreement_document_url text,
  ADD COLUMN IF NOT EXISTS jda_agreement_date date,
  ADD COLUMN IF NOT EXISTS builder_share_units integer,
  ADD COLUMN IF NOT EXISTS landowner_share_units integer;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_development_arrangement_chk;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_development_arrangement_chk
  CHECK (
    development_arrangement IS NULL
    OR development_arrangement IN ('self', 'joint_development')
  ) NOT VALID;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_total_project_flats_positive_chk
    CHECK (total_project_flats IS NULL OR total_project_flats > 0) NOT VALID;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_builder_share_units_non_negative_chk
    CHECK (builder_share_units IS NULL OR builder_share_units >= 0) NOT VALID;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_landowner_share_units_non_negative_chk
    CHECK (landowner_share_units IS NULL OR landowner_share_units >= 0) NOT VALID;

CREATE OR REPLACE FUNCTION public.create_project_with_stages_with_business_model(
  p_company_id uuid,
  p_created_by uuid,
  p_customer_id uuid,
  p_source_document_id uuid,
  p_project_type_id uuid,
  p_project_type_snapshot text,
  p_project_number text,
  p_name text,
  p_description text,
  p_site_address text,
  p_contract_amount numeric,
  p_budget_amount numeric,
  p_start_date date,
  p_expected_end_date date,
  p_actual_end_date date,
  p_status text,
  p_stage_drafts jsonb DEFAULT NULL,
  p_business_model text DEFAULT NULL,
  p_projected_sales_value numeric DEFAULT NULL,
  p_land_cost numeric DEFAULT NULL,
  p_development_arrangement text DEFAULT NULL,
  p_total_project_flats integer DEFAULT NULL,
  p_landowner_party_id uuid DEFAULT NULL,
  p_jda_agreement_reference text DEFAULT NULL,
  p_jda_agreement_document_url text DEFAULT NULL,
  p_jda_agreement_date date DEFAULT NULL,
  p_builder_share_units integer DEFAULT NULL,
  p_landowner_share_units integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id uuid;
  v_has_stage_drafts boolean := false;
  v_project_type_code text := NULL;
  v_enabled_models text[];
  v_model_text text;
  v_arrangement_text text;
BEGIN
  IF p_business_model IS NULL OR NULLIF(trim(p_business_model), '') IS NULL THEN
    RAISE EXCEPTION 'business_model is required for project creation and must be one of: contract_construction, property_development, civil_works_contract, material_supply.'
    USING HINT = 'Provide a non-blank business_model value for this project.';
  END IF;

  v_model_text := lower(trim(p_business_model));
  IF v_model_text NOT IN ('contract_construction', 'property_development', 'civil_works_contract', 'material_supply') THEN
    RAISE EXCEPTION 'Invalid business_model value: %. Allowed values are contract_construction, property_development, civil_works_contract, material_supply.', p_business_model
    USING HINT = 'Provide a supported business_model value for this project.';
  END IF;

  IF p_development_arrangement IS NOT NULL AND NULLIF(trim(p_development_arrangement), '') IS NOT NULL THEN
    v_arrangement_text := lower(trim(p_development_arrangement));
    IF v_arrangement_text NOT IN ('self', 'joint_development') THEN
      RAISE EXCEPTION 'Invalid development_arrangement value: %. Allowed values are self or joint_development.', p_development_arrangement
      USING HINT = 'Provide a supported development arrangement for property development projects.';
    END IF;
  END IF;

  IF v_model_text <> 'property_development' AND (
    p_development_arrangement IS NOT NULL
    OR p_landowner_party_id IS NOT NULL
    OR p_jda_agreement_reference IS NOT NULL
    OR p_jda_agreement_document_url IS NOT NULL
    OR p_jda_agreement_date IS NOT NULL
    OR p_total_project_flats IS NOT NULL
    OR p_builder_share_units IS NOT NULL
    OR p_landowner_share_units IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Development arrangement and JDA fields are permitted only when business_model = property_development.';
  END IF;

  IF v_model_text = 'property_development' AND v_arrangement_text IS NULL THEN
    RAISE EXCEPTION 'Property development projects require an explicit development arrangement: self or joint_development.'
    USING HINT = 'Set development_arrangement when creating a property development project.';
  END IF;

  IF v_arrangement_text = 'self' THEN
    IF p_landowner_party_id IS NOT NULL
       OR p_jda_agreement_reference IS NOT NULL
       OR p_jda_agreement_document_url IS NOT NULL
       OR p_jda_agreement_date IS NOT NULL
       OR p_total_project_flats IS NOT NULL
       OR p_builder_share_units IS NOT NULL
       OR p_landowner_share_units IS NOT NULL THEN
      RAISE EXCEPTION 'Self development must not contain landowner, JDA or flat-sharing fields.'
      USING HINT = 'Leave landowner and JDA fields empty for self development.';
    END IF;
  END IF;

  IF v_arrangement_text = 'joint_development' THEN
    IF p_landowner_party_id IS NULL THEN
      RAISE EXCEPTION 'Joint development requires landowner_party_id.'
      USING HINT = 'Provide a landowner party for joint development projects.';
    END IF;

    IF p_total_project_flats IS NULL OR p_total_project_flats <= 0 OR p_total_project_flats <> floor(p_total_project_flats::numeric) THEN
      RAISE EXCEPTION 'Joint development requires total_project_flats as a positive whole number.'
      USING HINT = 'Set total_project_flats to a whole number greater than zero.';
    END IF;

    IF p_builder_share_units IS NULL OR p_landowner_share_units IS NULL THEN
      RAISE EXCEPTION 'Joint development requires builder_share_units and landowner_share_units.'
      USING HINT = 'Provide both share counts.';
    END IF;

    IF p_builder_share_units < 0 OR p_landowner_share_units < 0 THEN
      RAISE EXCEPTION 'Builder and landowner share flats must be non-negative.'
      USING HINT = 'All share counts must be zero or greater.';
    END IF;

    IF p_builder_share_units + p_landowner_share_units <> p_total_project_flats THEN
      RAISE EXCEPTION 'Builder and landowner share flats must add up to the total project flats.'
      USING HINT = 'Use builder_share_units + landowner_share_units = total_project_flats.';
    END IF;
  END IF;

  SELECT enabled_business_models INTO v_enabled_models
  FROM public.company_settings
  WHERE company_id = p_company_id;

  IF v_enabled_models IS NULL OR NOT (v_model_text = ANY (v_enabled_models)) THEN
    RAISE EXCEPTION 'Business model % is not enabled for company %.', v_model_text, p_company_id
    USING HINT = 'Update company_settings.enabled_business_models to include this business model before creating the project.';
  END IF;

  INSERT INTO public.projects (
    company_id,
    customer_id,
    source_document_id,
    project_type_id,
    project_type_snapshot,
    business_model,
    projected_sales_value,
    land_cost,
    development_arrangement,
    total_project_flats,
    landowner_party_id,
    jda_agreement_reference,
    jda_agreement_document_url,
    jda_agreement_date,
    builder_share_units,
    landowner_share_units,
    project_number,
    name,
    description,
    site_address,
    contract_amount,
    budget_amount,
    start_date,
    expected_end_date,
    actual_end_date,
    status,
    created_by
  ) VALUES (
    p_company_id,
    p_customer_id,
    p_source_document_id,
    p_project_type_id,
    p_project_type_snapshot,
    v_model_text,
    p_projected_sales_value,
    p_land_cost,
    CASE WHEN v_model_text = 'property_development' THEN v_arrangement_text ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' THEN p_total_project_flats ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_landowner_party_id ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_reference ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_document_url ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_date ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_builder_share_units ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_landowner_share_units ELSE NULL END,
    p_project_number,
    p_name,
    p_description,
    p_site_address,
    COALESCE(p_contract_amount, 0),
    p_budget_amount,
    p_start_date,
    p_expected_end_date,
    p_actual_end_date,
    COALESCE(p_status, 'planned'),
    p_created_by
  )
  RETURNING id INTO v_project_id;

  v_has_stage_drafts := p_stage_drafts IS NOT NULL
    AND jsonb_typeof(p_stage_drafts) = 'array'
    AND jsonb_array_length(p_stage_drafts) > 0;

  IF p_project_type_id IS NOT NULL THEN
    SELECT code INTO v_project_type_code
    FROM public.project_types
    WHERE id = p_project_type_id;
  END IF;

  IF v_has_stage_drafts THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      planned_start_date,
      planned_end_date,
      completion_percentage,
      status,
      created_by
    )
    SELECT
      v_project_id,
      COALESCE(NULLIF(trim(draft.stage_row ->> 'name'), ''), 'New stage') AS name,
      row_number() OVER (
        ORDER BY
          COALESCE(
            CASE
              WHEN COALESCE(draft.stage_row ->> 'sequenceNumber', '') ~ '^[0-9]+$'
                THEN (draft.stage_row ->> 'sequenceNumber')::integer
              ELSE NULL
            END,
            draft.stage_ord
          ),
          draft.stage_ord
      ) AS sequence_number,
      NULLIF(draft.stage_row ->> 'plannedStartDate', '')::date,
      NULLIF(draft.stage_row ->> 'plannedEndDate', '')::date,
      0,
      'pending',
      p_created_by
    FROM jsonb_array_elements(p_stage_drafts) WITH ORDINALITY AS draft(stage_row, stage_ord)
    WHERE COALESCE(NULLIF(trim(draft.stage_row ->> 'name'), ''), '') <> ''
    ON CONFLICT (project_id, sequence_number) DO NOTHING;
  ELSIF p_project_type_id IS NOT NULL AND lower(coalesce(v_project_type_code, '')) <> 'other' THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      completion_percentage,
      status,
      created_by
    )
    WITH resolved_templates AS (
      SELECT DISTINCT ON (lower(coalesce(template_code, '')))
        template_code,
        name,
        sequence_number,
        company_id,
        updated_at,
        id
      FROM public.project_stage_templates
      WHERE project_type_id = p_project_type_id
        AND is_active = true
        AND (company_id = p_company_id OR company_id IS NULL)
      ORDER BY
        lower(coalesce(template_code, '')),
        (company_id = p_company_id) DESC,
        updated_at DESC,
        id DESC
    ),
    ordered_templates AS (
      SELECT
        name,
        row_number() OVER (ORDER BY sequence_number ASC, lower(name) ASC) AS sequence_number
      FROM resolved_templates
    )
    SELECT
      v_project_id,
      ordered_templates.name,
      ordered_templates.sequence_number,
      0,
      'pending',
      p_created_by
    FROM ordered_templates
    ON CONFLICT (project_id, sequence_number) DO NOTHING;
  END IF;

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_project_with_stages_with_business_model(
  uuid, uuid, uuid, uuid, uuid, text, text, text, text, text,
  numeric, numeric, date, date, date, text, jsonb, text, numeric, numeric,
  text, integer, uuid, text, text, date, integer, integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_project_with_stages_with_business_model(
  uuid, uuid, uuid, uuid, uuid, text, text, text, text, text,
  numeric, numeric, date, date, date, text, jsonb, text, numeric, numeric,
  text, integer, uuid, text, text, date, integer, integer
) TO service_role;

COMMIT;
