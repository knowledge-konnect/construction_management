ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS budget_amount numeric(18,2) CHECK (budget_amount IS NULL OR budget_amount >= 0);
