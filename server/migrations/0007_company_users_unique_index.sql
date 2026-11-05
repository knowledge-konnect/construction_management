BEGIN;

-- Concurrency protection for duplicate check and index creation in one transaction.
LOCK TABLE public.company_users IN SHARE ROW EXCLUSIVE MODE;

-- 1) Block if duplicates remain.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.company_users cu
        GROUP BY cu.user_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce unique company_users(user_id): duplicate memberships remain.';
    END IF;
END
$$;

-- 2) Validate existing index state/definition before deciding action.
DO $$
DECLARE
    v_named_exists boolean;
    v_named_exact boolean;
    v_named_valid_ready boolean;
    v_equivalent_exists boolean;
    v_equivalent_valid_ready boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_class idx
        JOIN pg_namespace ns ON ns.oid = idx.relnamespace
        WHERE ns.nspname = 'public'
          AND idx.relname = 'uq_company_users_user_id'
    ) INTO v_named_exists;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index ind
        JOIN pg_class idx ON idx.oid = ind.indexrelid
        JOIN pg_class tbl ON tbl.oid = ind.indrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = 'public'
          AND tbl.relname = 'company_users'
          AND idx.relname = 'uq_company_users_user_id'
          AND ind.indisunique = true
          AND ind.indpred IS NULL
          AND ind.indnkeyatts = 1
          AND EXISTS (
              SELECT 1
              FROM unnest(ind.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a
                ON a.attrelid = ind.indrelid
               AND a.attnum = k.attnum
              WHERE ord = 1
                AND a.attname = 'user_id'
          )
    ) INTO v_named_exact;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index ind
        JOIN pg_class idx ON idx.oid = ind.indexrelid
        JOIN pg_class tbl ON tbl.oid = ind.indrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = 'public'
          AND tbl.relname = 'company_users'
          AND idx.relname = 'uq_company_users_user_id'
          AND ind.indisvalid = true
          AND ind.indisready = true
    ) INTO v_named_valid_ready;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index ind
        JOIN pg_class idx ON idx.oid = ind.indexrelid
        JOIN pg_class tbl ON tbl.oid = ind.indrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = 'public'
          AND tbl.relname = 'company_users'
          AND ind.indisunique = true
          AND ind.indpred IS NULL
          AND ind.indnkeyatts = 1
          AND ind.indisvalid = true
          AND ind.indisready = true
          AND EXISTS (
              SELECT 1
              FROM unnest(ind.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a
                ON a.attrelid = ind.indrelid
               AND a.attnum = k.attnum
              WHERE ord = 1
                AND a.attname = 'user_id'
          )
    ) INTO v_equivalent_valid_ready;

    SELECT EXISTS (
        SELECT 1
        FROM pg_index ind
        JOIN pg_class idx ON idx.oid = ind.indexrelid
        JOIN pg_class tbl ON tbl.oid = ind.indrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = 'public'
          AND tbl.relname = 'company_users'
          AND ind.indisunique = true
          AND ind.indpred IS NULL
          AND ind.indnkeyatts = 1
          AND EXISTS (
              SELECT 1
              FROM unnest(ind.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
              JOIN pg_attribute a
                ON a.attrelid = ind.indrelid
               AND a.attnum = k.attnum
              WHERE ord = 1
                AND a.attname = 'user_id'
          )
    ) INTO v_equivalent_exists;

    IF v_named_exists THEN
        IF NOT v_named_exact THEN
            RAISE EXCEPTION
                'Index uq_company_users_user_id exists but definition differs. Manual review required.';
        ELSIF NOT v_named_valid_ready THEN
            RAISE EXCEPTION
                'Index uq_company_users_user_id exists but is not valid/ready. Manual remediation required.';
        END IF;
    ELSE
        IF v_equivalent_exists AND NOT v_equivalent_valid_ready THEN
            RAISE EXCEPTION
                'Equivalent unique index on user_id exists but is not valid/ready. Manual remediation required.';
        ELSIF v_equivalent_valid_ready THEN
            RAISE NOTICE
                'Equivalent valid/ready unique index on company_users(user_id) already exists. No new index created.';
        ELSE
            CREATE UNIQUE INDEX uq_company_users_user_id
                ON public.company_users (user_id);
        END IF;
    END IF;
END
$$;

-- 3) Final verification output
SELECT
    idx.relname AS index_name,
    ind.indisunique AS is_unique,
    ind.indisvalid AS is_valid,
    ind.indisready AS is_ready,
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
