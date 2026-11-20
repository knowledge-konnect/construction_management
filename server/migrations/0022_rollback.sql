-- Rolls back 0022_quotation_save_and_pdf_support.sql.
-- WARNING: dropping columns discards the data they hold (discount type, questionnaire,
-- payment notes, brand snapshots, ...). Take a backup first. Switch the server back to
-- the old save path BEFORE running this, otherwise saves will fail.
BEGIN;
DROP FUNCTION IF EXISTS public.save_quotation(uuid, jsonb, integer);
DROP FUNCTION IF EXISTS public.allocate_document_number(uuid, text);
ALTER TABLE public.document_exclusions DROP COLUMN IF EXISTS display_order;
ALTER TABLE public.document_inclusions DROP COLUMN IF EXISTS display_order;
ALTER TABLE public.payment_schedules   DROP COLUMN IF EXISTS notes;
ALTER TABLE public.document_items      DROP CONSTRAINT IF EXISTS document_items_row_type_check;
ALTER TABLE public.document_items      DROP COLUMN IF EXISTS row_type;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_version_check;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_discount_amount_check;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_discount_type_check;
ALTER TABLE public.documents
  DROP COLUMN IF EXISTS brand_snapshot,
  DROP COLUMN IF EXISTS validity,
  DROP COLUMN IF EXISTS internal_notes,
  DROP COLUMN IF EXISTS questionnaire,
  DROP COLUMN IF EXISTS additional_charge_items,
  DROP COLUMN IF EXISTS discount_amount,
  DROP COLUMN IF EXISTS discount_type,
  DROP COLUMN IF EXISTS version;
COMMIT;
