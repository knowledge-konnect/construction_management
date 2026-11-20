BEGIN;

-- Preserve existing project-type IDs and foreign-key references.
-- Existing codes are renamed in place so historical projects keep their project_type_id.
UPDATE public.project_types
SET code = 'independent_house',
    name = 'Independent House Construction',
    description = 'Construction of standalone and independent residential houses.',
    sort_order = 1,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'individual_house';

UPDATE public.project_types
SET name = 'Villa Construction',
    description = 'Construction of standalone villas and villa communities.',
    sort_order = 2,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'villa';

UPDATE public.project_types
SET code = 'apartment',
    name = 'Apartment Construction',
    description = 'Construction or development of apartment buildings and residential towers.',
    sort_order = 3,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'apartment_building';

UPDATE public.project_types
SET name = 'Commercial Building Construction',
    description = 'Construction of offices, retail buildings and other commercial properties.',
    sort_order = 4,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'commercial_building';

UPDATE public.project_types
SET name = 'Industrial & Warehouse Construction',
    description = 'Construction of industrial facilities, factories and warehouse buildings.',
    sort_order = 5,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'industrial_warehouse';

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES (NULL, 'industrial_warehouse', 'Industrial & Warehouse Construction', 'Construction of industrial facilities, factories and warehouse buildings.', 5, true)
ON CONFLICT ON CONSTRAINT uq_project_types
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

UPDATE public.project_types
SET name = 'Renovation & Remodeling',
    description = 'Renovation, rehabilitation and remodeling of existing residential or commercial properties.',
    sort_order = 6,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'renovation';

UPDATE public.project_types
SET code = 'building_extension',
    name = 'Building Extension & Additional Floor',
    description = 'Building extensions, alterations and construction of additional floors.',
    sort_order = 7,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'extension';

UPDATE public.project_types
SET code = 'interior_fitout',
    name = 'Interior Fit-out & Works',
    description = 'Interior fit-out, finishing and interior construction works.',
    sort_order = 8,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'interior';

UPDATE public.project_types
SET name = 'Structural Construction Works',
    description = 'Structural construction works including RCC, steel and structural building elements.',
    sort_order = 9,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'structural_works';

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES (NULL, 'structural_works', 'Structural Construction Works', 'Structural construction works including RCC, steel and structural building elements.', 9, true)
ON CONFLICT ON CONSTRAINT uq_project_types
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

UPDATE public.project_types
SET code = 'civil_infrastructure',
    name = 'Civil Infrastructure Works',
    description = 'Civil engineering and infrastructure works for residential, commercial and public facilities.',
    sort_order = 10,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'civil_only';

UPDATE public.project_types
SET name = 'Civil Infrastructure Works',
    description = 'Civil engineering and infrastructure works for residential, commercial and public facilities.',
    sort_order = 10,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'civil_infrastructure';

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES (NULL, 'road_drainage', 'Road & Drainage Works', 'Road construction, drainage systems, culverts and related infrastructure works.', 11, true)
ON CONFLICT ON CONSTRAINT uq_project_types
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

UPDATE public.project_types
SET name = 'Other / Custom Project',
    description = 'A project that does not fit the predefined project categories and requires custom planning.',
    sort_order = 12,
    is_active = true,
    updated_at = now()
WHERE company_id IS NULL AND code = 'other';

COMMIT;
