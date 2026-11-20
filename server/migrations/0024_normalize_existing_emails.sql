-- 0024_normalize_existing_emails.sql
--
-- Companion to the application-layer fix in server/src/auth.ts (findUserByEmail /
-- createUser now normalize to lower(trim(email)) before every lookup and insert).
-- This migration lowercases EXISTING rows to match, so a user who signed up as
-- "Jane@X.com" before this fix can still log in with "jane@x.com" afterwards.
--
-- Safe to re-run (WHERE clause only touches rows that still need it). If two existing
-- accounts already differ only by case (e.g. "a@x.com" and "A@x.com" both exist as
-- separate rows — only possible from before this fix), lowercasing either would collide
-- with the other, so those rows are deliberately left untouched and reported via a
-- NOTICE for manual review instead of failing the whole migration.
BEGIN;

DO $$
DECLARE
  v_collisions integer;
BEGIN
  SELECT count(*) INTO v_collisions
  FROM public.users u
  WHERE u.email <> lower(trim(u.email))
    AND EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id <> u.id AND lower(trim(u2.email)) = lower(trim(u.email))
    );
  IF v_collisions > 0 THEN
    RAISE NOTICE 'Skipped % row(s) whose lowercased email collides with another existing account — review these manually (e.g. merge or rename one).', v_collisions;
  END IF;
END $$;

UPDATE public.users u
SET email = lower(trim(u.email))
WHERE u.email <> lower(trim(u.email))
  AND NOT EXISTS (
    SELECT 1 FROM public.users u2
    WHERE u2.id <> u.id AND lower(trim(u2.email)) = lower(trim(u.email))
  );

COMMIT;
