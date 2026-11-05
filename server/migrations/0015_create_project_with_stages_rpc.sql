BEGIN;

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

COMMIT;
