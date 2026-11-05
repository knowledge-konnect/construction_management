ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_documents_project_company'
      AND conrelid = 'public.documents'::regclass
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT fk_documents_project_company
      FOREIGN KEY (project_id, company_id)
      REFERENCES public.projects(id, company_id)
      ON DELETE SET NULL;
  END IF;
END $$;
