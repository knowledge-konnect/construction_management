BEGIN;
SET TRANSACTION READ ONLY;

-- 1) Companies with missing or invalid owner_id
SELECT
    c.id AS company_id,
    c.owner_id,
    CASE
        WHEN c.owner_id IS NULL THEN 'owner_id_is_null'
        WHEN u.id IS NULL THEN 'owner_id_not_found_in_users'
        ELSE 'ok'
    END AS owner_integrity_status
FROM public.companies c
LEFT JOIN public.users u
    ON u.id = c.owner_id
WHERE c.owner_id IS NULL
   OR u.id IS NULL
ORDER BY c.id;

-- 2) Owners linked to another company
SELECT
    c.id AS owned_company_id,
    c.owner_id AS owner_user_id,
    cu.company_id AS linked_company_id,
    cu.role AS linked_role,
    cu.is_active AS linked_is_active
FROM public.companies c
JOIN public.company_users cu
    ON cu.user_id = c.owner_id
   AND cu.company_id <> c.id
ORDER BY c.id, cu.company_id;

-- 3) Owner membership exists but role is not owner
SELECT
    c.id AS company_id,
    c.owner_id AS owner_user_id,
    cu.role AS existing_role,
    cu.is_active AS existing_is_active
FROM public.companies c
JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = c.owner_id
WHERE cu.role <> 'owner'
ORDER BY c.id;

-- 4) Owner membership exists but inactive
SELECT
    c.id AS company_id,
    c.owner_id AS owner_user_id,
    cu.role AS existing_role,
    cu.is_active AS existing_is_active
FROM public.companies c
JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.user_id = c.owner_id
WHERE cu.is_active = false
ORDER BY c.id;

-- 5) Users linked to multiple companies
SELECT
    cu.user_id,
    COUNT(DISTINCT cu.company_id) AS company_count,
    ARRAY_AGG(DISTINCT cu.company_id ORDER BY cu.company_id) AS company_ids
FROM public.company_users cu
GROUP BY cu.user_id
HAVING COUNT(DISTINCT cu.company_id) > 1
ORDER BY company_count DESC, cu.user_id;

-- 6) Duplicate rows per (company_id, user_id)
SELECT
    cu.company_id,
    cu.user_id,
    COUNT(*) AS row_count
FROM public.company_users cu
GROUP BY cu.company_id, cu.user_id
HAVING COUNT(*) > 1
ORDER BY cu.company_id, cu.user_id;

-- 7) Duplicate rows per user_id (would block unique user_id index)
SELECT
    cu.user_id,
    COUNT(*) AS membership_rows,
    ARRAY_AGG(cu.company_id ORDER BY cu.company_id) AS company_ids
FROM public.company_users cu
GROUP BY cu.user_id
HAVING COUNT(*) > 1
ORDER BY membership_rows DESC, cu.user_id;

-- 8) Additional verification: every company has exactly one active owner membership
SELECT
    c.id AS company_id,
    COUNT(*) FILTER (WHERE cu.role = 'owner' AND cu.is_active = true) AS active_owner_count
FROM public.companies c
LEFT JOIN public.company_users cu
    ON cu.company_id = c.id
GROUP BY c.id
HAVING COUNT(*) FILTER (WHERE cu.role = 'owner' AND cu.is_active = true) <> 1
ORDER BY c.id;

-- 9) Additional verification: companies.owner_id must match the owner membership user_id
SELECT
    c.id AS company_id,
    c.owner_id AS companies_owner_id,
    cu.user_id AS owner_membership_user_id,
    cu.role,
    cu.is_active
FROM public.companies c
LEFT JOIN public.company_users cu
    ON cu.company_id = c.id
   AND cu.role = 'owner'
   AND cu.is_active = true
WHERE cu.user_id IS DISTINCT FROM c.owner_id
ORDER BY c.id;

-- 10) Additional verification: no company has multiple owner memberships
SELECT
    cu.company_id,
    COUNT(*) AS owner_membership_count,
    ARRAY_AGG(cu.user_id ORDER BY cu.user_id) AS owner_user_ids
FROM public.company_users cu
WHERE cu.role = 'owner'
GROUP BY cu.company_id
HAVING COUNT(*) > 1
ORDER BY cu.company_id;

-- 11) Additional verification: no inactive owner memberships remain unresolved
SELECT
    cu.company_id,
    cu.user_id,
    cu.role,
    cu.is_active
FROM public.company_users cu
WHERE cu.role = 'owner'
  AND cu.is_active = false
ORDER BY cu.company_id, cu.user_id;

-- 12) Index inspection including validity and readiness
SELECT
    ns.nspname AS schema_name,
    tbl.relname AS table_name,
    idx.relname AS index_name,
    ind.indisunique AS is_unique,
    ind.indisvalid AS is_valid,
    ind.indisready AS is_ready,
    ind.indislive AS is_live,
    pg_get_expr(ind.indpred, ind.indrelid) AS predicate,
    pg_get_indexdef(idx.oid) AS index_def
FROM pg_index ind
JOIN pg_class idx
    ON idx.oid = ind.indexrelid
JOIN pg_class tbl
    ON tbl.oid = ind.indrelid
JOIN pg_namespace ns
    ON ns.oid = tbl.relnamespace
WHERE ns.nspname = 'public'
  AND tbl.relname = 'company_users'
ORDER BY idx.relname;

COMMIT;
