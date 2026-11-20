BEGIN;

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES
  (NULL, 'independent_house', 'Independent House Construction', 'Construction of standalone and independent residential houses.', 1, true),
  (NULL, 'villa', 'Villa Construction', 'Construction of standalone villas and villa communities.', 2, true),
  (NULL, 'apartment', 'Apartment Construction', 'Construction or development of apartment buildings and residential towers.', 3, true),
  (NULL, 'commercial_building', 'Commercial Building Construction', 'Construction of offices, retail buildings and other commercial properties.', 4, true),
  (NULL, 'industrial_warehouse', 'Industrial & Warehouse Construction', 'Construction of industrial facilities, factories and warehouse buildings.', 5, true),
  (NULL, 'renovation', 'Renovation & Remodeling', 'Renovation, rehabilitation and remodeling of existing residential or commercial properties.', 6, true),
  (NULL, 'building_extension', 'Building Extension & Additional Floor', 'Building extensions, alterations and construction of additional floors.', 7, true),
  (NULL, 'interior_fitout', 'Interior Fit-out & Works', 'Interior fit-out, finishing and interior construction works.', 8, true),
  (NULL, 'structural_works', 'Structural Construction Works', 'Structural construction works including RCC, steel and structural building elements.', 9, true),
  (NULL, 'civil_infrastructure', 'Civil Infrastructure Works', 'Civil engineering and infrastructure works for residential, commercial and public facilities.', 10, true),
  (NULL, 'road_drainage', 'Road & Drainage Works', 'Road construction, drainage systems, culverts and related infrastructure works.', 11, true),
  (NULL, 'other', 'Other / Custom Project', 'A project that does not fit the predefined project categories and requires custom planning.', 12, true)
ON CONFLICT ON CONSTRAINT uq_project_types
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.expense_categories (company_id, code, name, description, sort_order, is_active)
VALUES
  (NULL, 'materials', 'Materials', 'Construction materials', 1, true),
  (NULL, 'labour', 'Labour', 'Labour charges', 2, true),
  (NULL, 'equipment', 'Equipment', 'Equipment and machinery', 3, true),
  (NULL, 'transport', 'Transport', 'Transport and logistics', 4, true),
  (NULL, 'misc', 'Miscellaneous', 'Other expenses', 5, true)
ON CONFLICT ON CONSTRAINT uq_expense_categories
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.units_of_measure (company_id, code, name, symbol, sort_order, is_active)
VALUES
  (NULL, 'sqft', 'Sq.ft', 'Sq.ft', 1, true),
  (NULL, 'sqm', 'Sq.m', 'Sq.m', 2, true),
  (NULL, 'nos', 'Nos', 'Nos', 3, true),
  (NULL, 'kg', 'Kg', 'Kg', 4, true),
  (NULL, 'cft', 'Cft', 'Cft', 5, true),
  (NULL, 'rft', 'Rft', 'Rft', 6, true),
  (NULL, 'bag', 'Bag', 'Bag', 7, true),
  (NULL, 'litre', 'Litre', 'Litre', 8, true),
  (NULL, 'lumpsum', 'LS / Lump Sum', 'LS', 9, true),
  (NULL, 'job', 'Job', 'Job', 10, true)
ON CONFLICT ON CONSTRAINT uq_units_of_measure
DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.payment_methods (company_id, code, name, sort_order, is_active)
VALUES
  (NULL, 'cash', 'Cash', 1, true),
  (NULL, 'upi', 'UPI', 2, true),
  (NULL, 'bank_transfer', 'Bank Transfer', 3, true),
  (NULL, 'cheque', 'Cheque', 4, true),
  (NULL, 'other', 'Other', 5, true)
ON CONFLICT ON CONSTRAINT uq_payment_methods
DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.tax_rates (company_id, code, name, rate_percentage, effective_from, effective_to, is_active)
VALUES
  (NULL, 'gst_0', 'GST 0%', 0.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_5', 'GST 5%', 5.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_12', 'GST 12%', 12.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_18', 'GST 18%', 18.00, DATE '2024-01-01', NULL, true),
  (NULL, 'gst_28', 'GST 28%', 28.00, DATE '2024-01-01', NULL, true)
ON CONFLICT ON CONSTRAINT uq_tax_rates
DO UPDATE SET
  name = EXCLUDED.name,
  rate_percentage = EXCLUDED.rate_percentage,
  effective_to = EXCLUDED.effective_to,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.project_stage_templates (company_id, project_type_id, template_code, name, sequence_number, default_completion_percentage, is_active)
SELECT
  NULL,
  pt.id,
  t.template_code,
  t.name,
  t.sequence_number,
  t.default_completion_percentage,
  true
FROM public.project_types pt
JOIN (
  VALUES
    ('independent_house', 'site_setup', 'Site Setup', 1, 5.00),
    ('independent_house', 'foundation', 'Foundation', 2, 20.00),
    ('independent_house', 'structure', 'RCC / Structure', 3, 45.00),
    ('independent_house', 'masonry', 'Masonry', 4, 60.00),
    ('independent_house', 'plastering', 'Plastering', 5, 70.00),
    ('independent_house', 'flooring', 'Flooring', 6, 80.00),
    ('independent_house', 'electrical_plumbing', 'Electrical & Plumbing', 7, 90.00),
    ('independent_house', 'painting', 'Painting', 8, 96.00),
    ('independent_house', 'handover', 'Handover', 9, 100.00)
) AS t(project_code, template_code, name, sequence_number, default_completion_percentage)
  ON pt.company_id IS NULL AND pt.code = t.project_code
ON CONFLICT ON CONSTRAINT uq_project_stage_templates
DO UPDATE SET
  name = EXCLUDED.name,
  sequence_number = EXCLUDED.sequence_number,
  default_completion_percentage = EXCLUDED.default_completion_percentage,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
