-- DESTRUCTIVE RESET SCRIPT (DEV/TEST ONLY)
-- WARNING: This script permanently drops application objects in public schema.
-- It must never be run on production/live Supabase data.
-- It does NOT drop Supabase-managed schemas (auth, storage, realtime, vault) or their objects.

BEGIN;

-- Objects dropped by this script:
-- Tables:
--   project_investor_contributions, project_investors,
--   project_attachments, project_client_access, project_receipts,
--   project_expense_payments, project_expenses,
--   project_progress_updates, project_stages, projects,
--   booking_receipt_details, document_terms, payment_schedules,
--   document_exclusions, document_inclusions, document_specifications,
--   document_items, document_sections, documents, document_sequences,
--   project_stage_templates, tax_rates, payment_methods,
--   units_of_measure, expense_categories, project_types,
--   subscription_payments, company_quotation_usage, company_subscriptions,
--   customers, company_settings, company_users, companies,
--   password_resets, refresh_tokens, user_profiles, users
-- Functions:
--   set_updated_at, current_app_user_id,
--   validate_project_source_quotation, validate_progress_stage_link,
--   validate_attachment_links, validate_document_master_scope,
--   validate_project_master_scope, validate_expense_master_scope,
--   validate_payment_method_scope, validate_document_item_unit_scope

DROP TABLE IF EXISTS public.project_investor_contributions CASCADE;
DROP TABLE IF EXISTS public.project_investors CASCADE;
DROP TABLE IF EXISTS public.project_attachments CASCADE;
DROP TABLE IF EXISTS public.project_client_access CASCADE;
DROP TABLE IF EXISTS public.project_receipts CASCADE;
DROP TABLE IF EXISTS public.project_expense_payments CASCADE;
DROP TABLE IF EXISTS public.project_expenses CASCADE;
DROP TABLE IF EXISTS public.project_progress_updates CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

DROP TABLE IF EXISTS public.booking_receipt_details CASCADE;
DROP TABLE IF EXISTS public.document_terms CASCADE;
DROP TABLE IF EXISTS public.payment_schedules CASCADE;
DROP TABLE IF EXISTS public.document_exclusions CASCADE;
DROP TABLE IF EXISTS public.document_inclusions CASCADE;
DROP TABLE IF EXISTS public.document_specifications CASCADE;
DROP TABLE IF EXISTS public.document_items CASCADE;
DROP TABLE IF EXISTS public.document_sections CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.document_sequences CASCADE;

DROP TABLE IF EXISTS public.project_stage_templates CASCADE;
DROP TABLE IF EXISTS public.tax_rates CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.units_of_measure CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.project_types CASCADE;

DROP TABLE IF EXISTS public.subscription_payments CASCADE;
DROP TABLE IF EXISTS public.company_quotation_usage CASCADE;
DROP TABLE IF EXISTS public.company_subscriptions CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.company_users CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

DROP TABLE IF EXISTS public.password_resets CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.current_app_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.validate_project_source_quotation() CASCADE;
DROP FUNCTION IF EXISTS public.validate_progress_stage_link() CASCADE;
DROP FUNCTION IF EXISTS public.validate_attachment_links() CASCADE;
DROP FUNCTION IF EXISTS public.validate_document_master_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_document_customer_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_project_master_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_project_customer_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_stage_template_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_expense_master_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_payment_method_scope() CASCADE;
DROP FUNCTION IF EXISTS public.validate_document_item_unit_scope() CASCADE;

COMMIT;
