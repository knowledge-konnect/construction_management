BEGIN;

-- Concurrency protection approach:
-- Lock company_users and companies for write stability inside this transaction,
-- so conflict detection and insert set remain stable until commit.
-- This blocks concurrent membership writes during the backfill window.
LOCK TABLE public.company_users IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.companies IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE membership_backfill_conflicts (
    conflict_type text NOT NULL,
    company_id uuid,
    owner_user_id uuid,
    details text
) ON COMMIT DROP;

-- A) Missing or invalid owner_id
INSERT INTO membership_backfill_conflicts (conflict_type, company_id, owner_user_id, details)
SELECT
    'missing_or_invalid_owner_id',
    c.id,
    c.owner_id,
    CASE
        WHEN c.owner_id IS NULL THEN 'owner_id is NULL'
        ELSE 'owner_id does not exist in users'
    END
FROM public.companies c
LEFT JOIN public.users u
    ON u.id = c.owner_id
WHERE c.owner_id IS NULL
   OR u.id IS NULL;

-- B) Owner linked to another company
INSERT INTO membership_backfill_conflicts (conflict_type, company_id, owner_user_id, details)
SELECT DISTINCT
    'owner_linked_to_other_company',
    c.id,
    c.owner_id,
    'owner has membership in company ' || cu.company_id::text || ' with role ' || COALESCE(cu.role, 'null')
FROM public.companies c
JOIN public.company_users cu
    ON cu.user_id = c.owner_id
   AND cu.company_id <> c.id;

-- C) Owner has own-company membership but non-owner role (report only)
INSERT INTO membership_backfill_conflicts (conflict_type, company_id, owner_user_id, details)
SELECT
    'owner_membership_role_conflict',
    c.id,
    c.owner_id,
    'existing role is ' || COALESCE(cu.role, 'null')
FROM public.companies c
JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = c.owner_id
WHERE cu.role <> 'owner';

-- D) Owner has own-company membership but inactive status (report only)
INSERT INTO membership_backfill_conflicts (conflict_type, company_id, owner_user_id, details)
SELECT
    'owner_membership_inactive_conflict',
    c.id,
    c.owner_id,
    'existing owner membership is inactive'
FROM public.companies c
JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = c.owner_id
WHERE cu.role = 'owner'
  AND cu.is_active = false;

-- E) Users linked to multiple companies
INSERT INTO membership_backfill_conflicts (conflict_type, company_id, owner_user_id, details)
SELECT
    'user_linked_to_multiple_companies',
    NULL,
    multi.user_id,
    'user is linked to ' || multi.company_count::text || ' companies'
FROM (
    SELECT
        cu.user_id,
        COUNT(DISTINCT cu.company_id) AS company_count
    FROM public.company_users cu
    GROUP BY cu.user_id
    HAVING COUNT(DISTINCT cu.company_id) > 1
) multi;

-- Report all conflicts for manual resolution
SELECT
    conflict_type,
    company_id,
    owner_user_id,
    details
FROM membership_backfill_conflicts
ORDER BY conflict_type, company_id, owner_user_id, details;

-- Stop on any conflict.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM membership_backfill_conflicts) THEN
        RAISE EXCEPTION
            'Owner-membership backfill halted: conflicts detected. Resolve manually, then rerun.';
    END IF;
END
$$;

-- Safe idempotent insert: only missing owner memberships.
INSERT INTO public.company_users (company_id, user_id, role, is_active)
SELECT
    c.id AS company_id,
    c.owner_id AS user_id,
    'owner' AS role,
    true AS is_active
FROM public.companies c
JOIN public.users u
    ON u.id = c.owner_id
LEFT JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = c.owner_id
WHERE cu.id IS NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Post-backfill verification snapshot
SELECT
    c.id AS company_id,
    c.owner_id,
    COUNT(*) FILTER (WHERE cu.role = 'owner' AND cu.is_active = true) AS active_owner_count
FROM public.companies c
LEFT JOIN public.company_users cu
    ON cu.company_id = c.id
GROUP BY c.id, c.owner_id
ORDER BY c.id;

COMMIT;
