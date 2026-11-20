BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone text;

COMMIT;
