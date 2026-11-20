BEGIN;

-- Canonicalize legacy/duplicate global project type codes without deleting history.
-- This migration preserves existing IDs for canonical rows, remaps FK references,
-- migrates stage templates, and deactivates deprecated duplicate rows.

WITH canonical AS (
  SELECT code, id
  FROM public.project_types
  WHERE company_id IS NULL
    AND code IN (
      'independent_house',
      'apartment',
      'building_extension',
      'interior_fitout',
      'civil_infrastructure',
      'road_drainage',
      'industrial_warehouse'
    )
), legacy_map AS (
  SELECT legacy.id AS legacy_id, legacy.code AS legacy_code, canonical.id AS canonical_id, canonical.code AS canonical_code
  FROM public.project_types legacy
  JOIN canonical
    ON canonical.code = CASE lower(legacy.code)
      WHEN 'individual_house' THEN 'independent_house'
      WHEN 'apartment_building' THEN 'apartment'
      WHEN 'extension' THEN 'building_extension'
      WHEN 'interior' THEN 'interior_fitout'
      WHEN 'civil_only' THEN 'civil_infrastructure'
      WHEN 'road' THEN 'road_drainage'
      WHEN 'drainage' THEN 'road_drainage'
      WHEN 'industrial' THEN 'industrial_warehouse'
      ELSE NULL
    END
  WHERE legacy.company_id IS NULL
)
UPDATE public.projects p
SET project_type_id = m.canonical_id,
    project_type_snapshot = COALESCE(pt.name, p.project_type_snapshot),
    updated_at = now()
FROM legacy_map m
LEFT JOIN public.project_types pt ON pt.id = m.canonical_id
WHERE p.project_type_id = m.legacy_id;

WITH canonical AS (
  SELECT code, id
  FROM public.project_types
  WHERE company_id IS NULL
    AND code IN (
      'independent_house',
      'apartment',
      'building_extension',
      'interior_fitout',
      'civil_infrastructure',
      'road_drainage',
      'industrial_warehouse'
    )
), legacy_map AS (
  SELECT legacy.id AS legacy_id, canonical.id AS canonical_id
  FROM public.project_types legacy
  JOIN canonical
    ON canonical.code = CASE lower(legacy.code)
      WHEN 'individual_house' THEN 'independent_house'
      WHEN 'apartment_building' THEN 'apartment'
      WHEN 'extension' THEN 'building_extension'
      WHEN 'interior' THEN 'interior_fitout'
      WHEN 'civil_only' THEN 'civil_infrastructure'
      WHEN 'road' THEN 'road_drainage'
      WHEN 'drainage' THEN 'road_drainage'
      WHEN 'industrial' THEN 'industrial_warehouse'
      ELSE NULL
    END
  WHERE legacy.company_id IS NULL
)
UPDATE public.documents d
SET project_type_id = m.canonical_id,
    project_type = COALESCE(pt.name, d.project_type),
    updated_at = now()
FROM legacy_map m
LEFT JOIN public.project_types pt ON pt.id = m.canonical_id
WHERE d.project_type_id = m.legacy_id;

WITH canonical AS (
  SELECT code, id
  FROM public.project_types
  WHERE company_id IS NULL
    AND code IN (
      'independent_house',
      'apartment',
      'building_extension',
      'interior_fitout',
      'civil_infrastructure',
      'road_drainage',
      'industrial_warehouse'
    )
), legacy_map AS (
  SELECT legacy.id AS legacy_id, canonical.id AS canonical_id
  FROM public.project_types legacy
  JOIN canonical
    ON canonical.code = CASE lower(legacy.code)
      WHEN 'individual_house' THEN 'independent_house'
      WHEN 'apartment_building' THEN 'apartment'
      WHEN 'extension' THEN 'building_extension'
      WHEN 'interior' THEN 'interior_fitout'
      WHEN 'civil_only' THEN 'civil_infrastructure'
      WHEN 'road' THEN 'road_drainage'
      WHEN 'drainage' THEN 'road_drainage'
      WHEN 'industrial' THEN 'industrial_warehouse'
      ELSE NULL
    END
  WHERE legacy.company_id IS NULL
) , staged_templates AS (
  SELECT
    pst.company_id,
    m.canonical_id AS project_type_id,
    pst.template_code,
    pst.name,
    pst.sequence_number,
    pst.default_completion_percentage,
    pst.is_active,
    pst.created_at,
    pst.updated_at,
    pst.id
  FROM public.project_stage_templates pst
  JOIN legacy_map m ON m.legacy_id = pst.project_type_id
), deduped_templates AS (
  SELECT DISTINCT ON (
    company_id,
    project_type_id,
    lower(coalesce(template_code, ''))
  )
    company_id,
    project_type_id,
    template_code,
    name,
    sequence_number,
    default_completion_percentage,
    is_active,
    created_at
  FROM staged_templates
  ORDER BY
    company_id,
    project_type_id,
    lower(coalesce(template_code, '')),
    updated_at DESC,
    id DESC
)
INSERT INTO public.project_stage_templates (
  company_id,
  project_type_id,
  template_code,
  name,
  sequence_number,
  default_completion_percentage,
  is_active,
  created_at,
  updated_at
)
SELECT
  d.company_id,
  d.project_type_id,
  d.template_code,
  d.name,
  d.sequence_number,
  d.default_completion_percentage,
  d.is_active,
  d.created_at,
  now()
FROM deduped_templates d
ON CONFLICT ON CONSTRAINT uq_project_stage_templates
DO UPDATE SET
  name = EXCLUDED.name,
  sequence_number = EXCLUDED.sequence_number,
  default_completion_percentage = EXCLUDED.default_completion_percentage,
  is_active = EXCLUDED.is_active,
  updated_at = now();

WITH canonical AS (
  SELECT code, id
  FROM public.project_types
  WHERE company_id IS NULL
    AND code IN (
      'independent_house',
      'apartment',
      'building_extension',
      'interior_fitout',
      'civil_infrastructure',
      'road_drainage',
      'industrial_warehouse'
    )
), legacy_map AS (
  SELECT legacy.id AS legacy_id
  FROM public.project_types legacy
  JOIN canonical
    ON canonical.code = CASE lower(legacy.code)
      WHEN 'individual_house' THEN 'independent_house'
      WHEN 'apartment_building' THEN 'apartment'
      WHEN 'extension' THEN 'building_extension'
      WHEN 'interior' THEN 'interior_fitout'
      WHEN 'civil_only' THEN 'civil_infrastructure'
      WHEN 'road' THEN 'road_drainage'
      WHEN 'drainage' THEN 'road_drainage'
      WHEN 'industrial' THEN 'industrial_warehouse'
      ELSE NULL
    END
  WHERE legacy.company_id IS NULL
)
DELETE FROM public.project_stage_templates pst
USING legacy_map m
WHERE pst.project_type_id = m.legacy_id;

UPDATE public.project_types
SET is_active = false,
    updated_at = now()
WHERE company_id IS NULL
  AND lower(code) IN (
    'individual_house',
    'apartment_building',
    'extension',
    'interior',
    'civil_only',
    'road',
    'drainage',
    'industrial'
  );

COMMIT;
