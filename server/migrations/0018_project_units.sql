BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_company_id_id
  ON public.projects (company_id, id);

CREATE TABLE IF NOT EXISTS public.project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL,
  flat_no text NOT NULL,
  floor integer,
  block_tower text,
  share_type text NOT NULL CHECK (share_type IN ('builder', 'landowner')),
  status text NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'allocated', 'booked')
    AND (
      (share_type = 'builder' AND status IN ('available', 'allocated', 'booked'))
      OR (share_type = 'landowner' AND status IN ('allocated', 'booked'))
    )
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_units_company_project_fk
    FOREIGN KEY (company_id, project_id)
    REFERENCES public.projects(company_id, id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_units_project_flat_no_case_insensitive
  ON public.project_units (project_id, lower(trim(flat_no)));

CREATE INDEX IF NOT EXISTS idx_project_units_company_project
  ON public.project_units (company_id, project_id, flat_no);

CREATE INDEX IF NOT EXISTS idx_project_units_project_share
  ON public.project_units (project_id, share_type, status);

CREATE TRIGGER set_project_units_updated_at
BEFORE UPDATE ON public.project_units
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
