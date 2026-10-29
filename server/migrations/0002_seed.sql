BEGIN;

INSERT INTO public.project_types (company_id, code, name, description, sort_order, is_active)
VALUES
  (NULL, 'individual_house', 'Individual House', 'Standalone houses', 1, true),
  (NULL, 'villa', 'Villa', 'Villa projects', 2, true),
  (NULL, 'apartment_building', 'Apartment Building', 'Apartment projects', 3, true),
  (NULL, 'commercial_building', 'Commercial Building', 'Commercial projects', 4, true),
  (NULL, 'renovation', 'Renovation', 'Renovation projects', 5, true),
  (NULL, 'extension', 'Extension / Additional Floor', 'Extension projects', 6, true),
  (NULL, 'interior', 'Interior Works', 'Interior works', 7, true),
  (NULL, 'civil_only', 'Civil Works Only', 'Civil-only projects', 8, true),
  (NULL, 'other', 'Other', 'Other type', 9, true)
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
    ('individual_house', 'site_setup', 'Site Setup', 1, 5.00),
    ('individual_house', 'foundation', 'Foundation', 2, 20.00),
    ('individual_house', 'structure', 'RCC / Structure', 3, 45.00),
    ('individual_house', 'masonry', 'Masonry', 4, 60.00),
    ('individual_house', 'plastering', 'Plastering', 5, 70.00),
    ('individual_house', 'flooring', 'Flooring', 6, 80.00),
    ('individual_house', 'electrical_plumbing', 'Electrical & Plumbing', 7, 90.00),
    ('individual_house', 'painting', 'Painting', 8, 96.00),
    ('individual_house', 'handover', 'Handover', 9, 100.00)
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
