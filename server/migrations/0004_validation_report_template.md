# SQL Validation Report (To Fill After Disposable DB Run)

## Environment
- PostgreSQL version:
- Disposable DB target:
- Execution timestamp:

## Scripts executed
1. `0001_schema.sql`
2. `0002_seed.sql`
3. (optional destructive check) `0000_DESTRUCTIVE_reset_app_schema.sql`

## Results
- Schema script: PASS/FAIL
- Seed script: PASS/FAIL
- Repeat seed script (idempotency): PASS/FAIL
- Destructive reset script: PASS/FAIL

## Errors (if any)
-

## Notes
- Confirm no drops outside `public` application objects.
- Confirm no use of `ON DELETE SET NULL` that can null required ownership columns.
- Confirm master scope triggers enforce company/global references.
