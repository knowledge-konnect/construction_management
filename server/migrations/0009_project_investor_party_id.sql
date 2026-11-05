BEGIN;

ALTER TABLE public.project_investors
  ADD COLUMN IF NOT EXISTS party_id uuid
  REFERENCES public.parties(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_investors_project_party_unique
  ON public.project_investors (project_id, party_id)
  WHERE party_id IS NOT NULL;

COMMIT;
