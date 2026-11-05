BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS business_model text CHECK (business_model IS NULL OR business_model IN ('contract_construction', 'property_development', 'civil_works_contract', 'material_supply')),
  ADD COLUMN IF NOT EXISTS projected_sales_value numeric(18,2) CHECK (projected_sales_value IS NULL OR projected_sales_value >= 0),
  ADD COLUMN IF NOT EXISTS land_cost numeric(18,2) CHECK (land_cost IS NULL OR land_cost >= 0);

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS enabled_business_models text[] NOT NULL DEFAULT ARRAY['contract_construction', 'property_development', 'civil_works_contract', 'material_supply'];

UPDATE public.company_settings
SET enabled_business_models = ARRAY['contract_construction', 'property_development', 'civil_works_contract', 'material_supply']
WHERE enabled_business_models IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_business_model
  ON public.projects(company_id, business_model)
  WHERE business_model IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_project_with_stages(
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
  p_stage_drafts jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id uuid;
  v_has_stage_drafts boolean := false;
  v_project_type_code text := NULL;
BEGIN
  INSERT INTO public.projects (
    company_id,
    customer_id,
    source_document_id,
    project_type_id,
    project_type_snapshot,
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
  p_land_cost numeric DEFAULT NULL
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
    CASE
      WHEN v_model_text IS NOT NULL THEN v_model_text
      ELSE NULL
    END,
    p_projected_sales_value,
    p_land_cost,
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

COMMIT;
