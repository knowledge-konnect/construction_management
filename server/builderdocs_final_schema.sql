--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.5

-- Started on 2026-11-20 15:12:57

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 28 (class 2615 OID 16498)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- TOC entry 20 (class 2615 OID 16392)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- TOC entry 27 (class 2615 OID 16578)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- TOC entry 26 (class 2615 OID 16567)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- TOC entry 11 (class 2615 OID 16390)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- TOC entry 31 (class 2615 OID 16559)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- TOC entry 29 (class 2615 OID 16546)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- TOC entry 25 (class 2615 OID 16607)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- TOC entry 4 (class 3079 OID 16393)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 2 (class 3079 OID 16447)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16608)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16436)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1153 (class 1247 OID 16744)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- TOC entry 1177 (class 1247 OID 16885)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- TOC entry 1150 (class 1247 OID 16738)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1147 (class 1247 OID 16733)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone',
    'recovery_code'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1195 (class 1247 OID 16988)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1207 (class 1247 OID 17061)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1189 (class 1247 OID 16966)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1198 (class 1247 OID 16998)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1183 (class 1247 OID 16927)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1222 (class 1247 OID 17177)
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_realtime_admin;

--
-- TOC entry 1225 (class 1247 OID 17188)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin;

--
-- TOC entry 1228 (class 1247 OID 17217)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin;

--
-- TOC entry 1231 (class 1247 OID 17220)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin;

--
-- TOC entry 1234 (class 1247 OID 17223)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin;

--
-- TOC entry 1261 (class 1247 OID 17408)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- TOC entry 417 (class 1255 OID 16544)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 417
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 430 (class 1255 OID 16715)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- TOC entry 416 (class 1255 OID 16543)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 416
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 415 (class 1255 OID 16542)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 415
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 418 (class 1255 OID 16551)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 422 (class 1255 OID 16572)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 422
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 419 (class 1255 OID 16553)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 419
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 420 (class 1255 OID 16563)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- TOC entry 421 (class 1255 OID 16564)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- TOC entry 423 (class 1255 OID 16574)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 423
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 429 (class 1255 OID 16665)
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- TOC entry 365 (class 1255 OID 16391)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- TOC entry 490 (class 1255 OID 27677)
-- Name: allocate_document_number(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allocate_document_number(p_company_id uuid, p_document_type text) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_local  timestamp := (now() AT TIME ZONE 'Asia/Kolkata');
  v_fy     integer;
  v_prefix text;
  v_used   text;
  v_next   integer;
BEGIN
  IF p_document_type NOT IN ('Quotation', 'BookingReceipt') THEN
    RAISE EXCEPTION 'Unsupported document type %', p_document_type USING ERRCODE = '22023';
  END IF;

  -- Indian financial year (Apr-Mar), stored as its starting calendar year.
  v_fy := CASE WHEN extract(month FROM v_local) >= 4
               THEN extract(year FROM v_local)::integer
               ELSE extract(year FROM v_local)::integer - 1 END;

  SELECT CASE WHEN p_document_type = 'BookingReceipt'
              THEN COALESCE(NULLIF(s.booking_prefix, ''), 'BR')
              ELSE COALESCE(NULLIF(s.quotation_prefix, ''), 'QTN') END
    INTO v_prefix
  FROM public.company_settings s WHERE s.company_id = p_company_id;

  v_prefix := COALESCE(v_prefix, CASE WHEN p_document_type = 'BookingReceipt' THEN 'BR' ELSE 'QTN' END);

  -- First use of a (company, type, year) takes number 1 and leaves next_number = 2;
  -- afterwards every call atomically bumps it. A rolled-back caller gives the number back.
  INSERT INTO public.document_sequences AS ds (company_id, document_type, financial_year, prefix, next_number)
  VALUES (p_company_id, p_document_type, v_fy, v_prefix, 2)
  ON CONFLICT (company_id, document_type, financial_year)
  DO UPDATE SET next_number = ds.next_number + 1, updated_at = now()
  RETURNING ds.prefix, ds.next_number - 1 INTO v_used, v_next;

  RETURN v_used || '/' || v_fy::text || '/' || lpad(v_next::text, 3, '0');
END;
$$;


ALTER FUNCTION public.allocate_document_number(p_company_id uuid, p_document_type text) OWNER TO postgres;

--
-- TOC entry 494 (class 1255 OID 27707)
-- Name: apply_receipt_allocation(uuid, uuid, uuid, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_receipt_allocation(p_company_id uuid, p_receipt_id uuid, p_invoice_id uuid, p_requested_amount numeric) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_receipt record;
    v_invoice record;
    v_receipt_total_allocated numeric;
    v_invoice_total_allocated numeric;
    v_receipt_remaining numeric;
    v_invoice_outstanding numeric;
    v_allocated_amount numeric;
    v_allocation record;
BEGIN
    SELECT *
    INTO v_receipt
    FROM public.project_receipts
    WHERE id = p_receipt_id
      AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receipt not found.';
    END IF;

    SELECT *
    INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id
      AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found.';
    END IF;

    IF v_invoice.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Cancelled invoices cannot receive payment allocations.';
    END IF;

    IF v_invoice.status <> 'Issued' THEN
        RAISE EXCEPTION 'Only issued invoices can receive payment allocations.';
    END IF;

    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_receipt_total_allocated
    FROM public.payment_allocations
    WHERE receipt_id = p_receipt_id;

    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_invoice_total_allocated
    FROM public.payment_allocations
    WHERE invoice_id = p_invoice_id;

    -- Balances before this allocation
    v_receipt_remaining :=
        GREATEST(v_receipt.amount - v_receipt_total_allocated, 0::numeric);

    v_invoice_outstanding :=
        GREATEST(v_invoice.grand_total - v_invoice_total_allocated, 0::numeric);

    IF p_requested_amount IS NULL OR p_requested_amount <= 0 THEN
        RAISE EXCEPTION 'Allocation amount must be greater than zero.';
    END IF;

    IF v_receipt_remaining <= 0 THEN
        RAISE EXCEPTION 'This receipt has no remaining balance to allocate.';
    END IF;

    IF v_invoice_outstanding <= 0 THEN
        RAISE EXCEPTION 'This invoice is already fully paid.';
    END IF;

    v_allocated_amount :=
        LEAST(p_requested_amount, v_receipt_remaining, v_invoice_outstanding);

    IF v_allocated_amount <= 0 THEN
        RAISE EXCEPTION
            'Requested amount exceeds the remaining receipt balance or invoice outstanding amount.';
    END IF;

    INSERT INTO public.payment_allocations (
        company_id,
        invoice_id,
        receipt_id,
        allocated_amount
    )
    VALUES (
        p_company_id,
        p_invoice_id,
        p_receipt_id,
        v_allocated_amount
    )
    RETURNING * INTO v_allocation;

    RETURN jsonb_build_object(
        'allocation', jsonb_build_object(
            'id', v_allocation.id,
            'companyId', v_allocation.company_id,
            'invoiceId', v_allocation.invoice_id,
            'receiptId', v_allocation.receipt_id,
            'allocatedAmount', v_allocation.allocated_amount,
            'createdAt', v_allocation.created_at
        ),

        -- Existing fields retained for compatibility (pre-allocation balances)
        'receiptRemaining', v_receipt_remaining,
        'invoiceOutstanding', v_invoice_outstanding,

        -- New fields (post-allocation balances)
        'receiptRemainingAfter',
            v_receipt_remaining - v_allocated_amount,
        'invoiceOutstandingAfter',
            v_invoice_outstanding - v_allocated_amount,

        'allocatedAmount', v_allocated_amount
    );
END;
$$;


ALTER FUNCTION public.apply_receipt_allocation(p_company_id uuid, p_receipt_id uuid, p_invoice_id uuid, p_requested_amount numeric) OWNER TO postgres;

--
-- TOC entry 493 (class 1255 OID 27706)
-- Name: cancel_booking_receipt_unit(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_booking_receipt_unit(p_document_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_booking record;
  v_unit record;
BEGIN
  SELECT brd.document_id, brd.project_unit_id, brd.booking_status, brd.prior_unit_status, d.company_id, d.project_id, d.is_deleted
    INTO v_booking
  FROM public.booking_receipt_details brd
  JOIN public.documents d ON d.id = brd.document_id
  WHERE brd.document_id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking document not found.';
  END IF;

  IF v_booking.is_deleted THEN
    RAISE EXCEPTION 'This receipt has been deleted and can no longer be modified.';
  END IF;

  IF v_booking.project_unit_id IS NULL THEN
    UPDATE public.booking_receipt_details
    SET booking_status = 'Cancelled'
    WHERE document_id = p_document_id;
    RETURN;
  END IF;

  SELECT pu.status, pu.company_id, pu.project_id
    INTO v_unit
  FROM public.project_units pu
  WHERE pu.id = v_booking.project_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit linked to this booking no longer exists.';
  END IF;

  UPDATE public.booking_receipt_details
  SET booking_status = 'Cancelled'
  WHERE document_id = p_document_id;

  IF v_unit.status = 'booked' THEN
    UPDATE public.project_units
    SET status = COALESCE(v_booking.prior_unit_status, 'available'),
        updated_at = now()
    WHERE id = v_booking.project_unit_id;
  END IF;
END;
$$;


ALTER FUNCTION public.cancel_booking_receipt_unit(p_document_id uuid) OWNER TO postgres;

--
-- TOC entry 492 (class 1255 OID 27705)
-- Name: confirm_booking_receipt_unit(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.confirm_booking_receipt_unit(p_document_id uuid, p_project_unit_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_document record;
  v_unit record;
  v_active_booking_count integer;
BEGIN
  SELECT d.id, d.company_id, d.project_id, d.is_deleted, d.status
    INTO v_document
  FROM public.documents d
  WHERE d.id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Booking document not found.'; END IF;
  IF v_document.is_deleted THEN RAISE EXCEPTION 'This receipt has been deleted and can no longer be modified.'; END IF;

  SELECT pu.id, pu.company_id, pu.project_id, pu.status
    INTO v_unit
  FROM public.project_units pu
  WHERE pu.id = p_project_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Selected project unit was not found.'; END IF;
  IF v_unit.company_id <> v_document.company_id THEN RAISE EXCEPTION 'Selected unit does not belong to this company.'; END IF;
  IF v_unit.project_id <> v_document.project_id THEN RAISE EXCEPTION 'Selected unit does not belong to this project.'; END IF;

  IF v_unit.status = 'booked' THEN
    SELECT count(*) INTO v_active_booking_count
    FROM public.booking_receipt_details brd
    JOIN public.documents d ON d.id = brd.document_id
    WHERE brd.project_unit_id = p_project_unit_id
      AND brd.booking_status IN ('Confirmed', 'Completed')
      AND brd.document_id <> p_document_id
      AND d.is_deleted = false;

    IF v_active_booking_count > 0 THEN RAISE EXCEPTION 'This unit already has an active booking.'; END IF;
  ELSIF v_unit.status NOT IN ('available', 'allocated') THEN
    RAISE EXCEPTION 'This unit is not available for booking.';
  END IF;

  UPDATE public.booking_receipt_details
  SET project_unit_id = p_project_unit_id,
      booking_status = 'Confirmed',
      prior_unit_status = CASE WHEN v_unit.status = 'booked' THEN COALESCE(prior_unit_status, 'available') ELSE v_unit.status END
  WHERE document_id = p_document_id;

  UPDATE public.project_units
  SET status = 'booked', updated_at = now()
  WHERE id = p_project_unit_id;
END;
$$;


ALTER FUNCTION public.confirm_booking_receipt_unit(p_document_id uuid, p_project_unit_id uuid) OWNER TO postgres;

--
-- TOC entry 484 (class 1255 OID 27502)
-- Name: create_project_with_stages(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, numeric, numeric, date, date, date, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_project_with_stages(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_project_id uuid;
  v_has_stage_drafts boolean := false;
  v_project_type_code text := NULL;
BEGIN
  INSERT INTO public.projects (
    company_id,
    customer_id,
    source_document_id,
    project_type_id,
    project_type_snapshot,
    project_number,
    name,
    description,
    site_address,
    contract_amount,
    budget_amount,
    start_date,
    expected_end_date,
    actual_end_date,
    status,
    created_by
  ) VALUES (
    p_company_id,
    p_customer_id,
    p_source_document_id,
    p_project_type_id,
    p_project_type_snapshot,
    p_project_number,
    p_name,
    p_description,
    p_site_address,
    COALESCE(p_contract_amount, 0),
    p_budget_amount,
    p_start_date,
    p_expected_end_date,
    p_actual_end_date,
    COALESCE(p_status, 'planned'),
    p_created_by
  )
  RETURNING id INTO v_project_id;

  v_has_stage_drafts := p_stage_drafts IS NOT NULL
    AND jsonb_typeof(p_stage_drafts) = 'array'
    AND jsonb_array_length(p_stage_drafts) > 0;

  IF p_project_type_id IS NOT NULL THEN
    SELECT code INTO v_project_type_code
    FROM public.project_types
    WHERE id = p_project_type_id;
  END IF;

  IF v_has_stage_drafts THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      planned_start_date,
      planned_end_date,
      completion_percentage,
      status,
      created_by
    )
    SELECT
      v_project_id,
      COALESCE(NULLIF(trim(draft.stage_row ->> 'name'), ''), 'New stage') AS name,
      row_number() OVER (
        ORDER BY
          COALESCE(
            CASE
              WHEN COALESCE(draft.stage_row ->> 'sequenceNumber', '') ~ '^[0-9]+$'
                THEN (draft.stage_row ->> 'sequenceNumber')::integer
              ELSE NULL
            END,
            draft.stage_ord
          ),
          draft.stage_ord
      ) AS sequence_number,
      NULLIF(draft.stage_row ->> 'plannedStartDate', '')::date,
      NULLIF(draft.stage_row ->> 'plannedEndDate', '')::date,
      0,
      'pending',
      p_created_by
    FROM jsonb_array_elements(p_stage_drafts) WITH ORDINALITY AS draft(stage_row, stage_ord)
    WHERE COALESCE(NULLIF(trim(draft.stage_row ->> 'name'), ''), '') <> ''
    ON CONFLICT (project_id, sequence_number) DO NOTHING;
  ELSIF p_project_type_id IS NOT NULL AND lower(coalesce(v_project_type_code, '')) <> 'other' THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      completion_percentage,
      status,
      created_by
    )
    WITH resolved_templates AS (
      SELECT DISTINCT ON (lower(coalesce(template_code, '')))
        template_code,
        name,
        sequence_number,
        company_id,
        updated_at,
        id
      FROM public.project_stage_templates
      WHERE project_type_id = p_project_type_id
        AND is_active = true
        AND (company_id = p_company_id OR company_id IS NULL)
      ORDER BY
        lower(coalesce(template_code, '')),
        (company_id = p_company_id) DESC,
        updated_at DESC,
        id DESC
    ),
    ordered_templates AS (
      SELECT
        name,
        row_number() OVER (ORDER BY sequence_number ASC, lower(name) ASC) AS sequence_number
      FROM resolved_templates
    )
    SELECT
      v_project_id,
      ordered_templates.name,
      ordered_templates.sequence_number,
      0,
      'pending',
      p_created_by
    FROM ordered_templates
    ON CONFLICT (project_id, sequence_number) DO NOTHING;
  END IF;

  RETURN v_project_id;
END;
$_$;


ALTER FUNCTION public.create_project_with_stages(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb) OWNER TO postgres;

--
-- TOC entry 489 (class 1255 OID 27557)
-- Name: create_project_with_stages_with_business_model(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, numeric, numeric, date, date, date, text, jsonb, text, numeric, numeric, text, integer, uuid, text, text, date, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_project_with_stages_with_business_model(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb DEFAULT NULL::jsonb, p_business_model text DEFAULT NULL::text, p_projected_sales_value numeric DEFAULT NULL::numeric, p_land_cost numeric DEFAULT NULL::numeric, p_development_arrangement text DEFAULT NULL::text, p_total_project_flats integer DEFAULT NULL::integer, p_landowner_party_id uuid DEFAULT NULL::uuid, p_jda_agreement_reference text DEFAULT NULL::text, p_jda_agreement_document_url text DEFAULT NULL::text, p_jda_agreement_date date DEFAULT NULL::date, p_builder_share_units integer DEFAULT NULL::integer, p_landowner_share_units integer DEFAULT NULL::integer) RETURNS uuid
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_project_id uuid;
  v_stage_drafts_supplied boolean := false;
  v_has_stage_drafts boolean := false;
  v_project_type_code text := NULL;
  v_enabled_models text[];
  v_model_text text;
  v_arrangement_text text;
BEGIN
  IF p_business_model IS NULL OR NULLIF(trim(p_business_model), '') IS NULL THEN
    RAISE EXCEPTION 'business_model is required for project creation and must be one of: contract_construction, property_development, civil_works_contract, material_supply.'
    USING HINT = 'Provide a non-blank business_model value for this project.';
  END IF;

  v_model_text := lower(trim(p_business_model));
  IF v_model_text NOT IN ('contract_construction', 'property_development', 'civil_works_contract', 'material_supply') THEN
    RAISE EXCEPTION 'Invalid business_model value: %. Allowed values are contract_construction, property_development, civil_works_contract, material_supply.', p_business_model
    USING HINT = 'Provide a supported business_model value for this project.';
  END IF;

  IF p_development_arrangement IS NOT NULL AND NULLIF(trim(p_development_arrangement), '') IS NOT NULL THEN
    v_arrangement_text := lower(trim(p_development_arrangement));
    IF v_arrangement_text NOT IN ('self', 'joint_development') THEN
      RAISE EXCEPTION 'Invalid development_arrangement value: %. Allowed values are self or joint_development.', p_development_arrangement
      USING HINT = 'Provide a supported development arrangement for property development projects.';
    END IF;
  END IF;

  IF v_model_text <> 'property_development' AND (
    p_development_arrangement IS NOT NULL
    OR p_landowner_party_id IS NOT NULL
    OR p_jda_agreement_reference IS NOT NULL
    OR p_jda_agreement_document_url IS NOT NULL
    OR p_jda_agreement_date IS NOT NULL
    OR p_total_project_flats IS NOT NULL
    OR p_builder_share_units IS NOT NULL
    OR p_landowner_share_units IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Development arrangement and JDA fields are permitted only when business_model = property_development.';
  END IF;

  IF v_model_text = 'property_development' AND v_arrangement_text IS NULL THEN
    RAISE EXCEPTION 'Property development projects require an explicit development arrangement: self or joint_development.'
    USING HINT = 'Set development_arrangement when creating a property development project.';
  END IF;

  IF v_arrangement_text = 'self' THEN
    IF p_landowner_party_id IS NOT NULL
       OR p_jda_agreement_reference IS NOT NULL
       OR p_jda_agreement_document_url IS NOT NULL
       OR p_jda_agreement_date IS NOT NULL
       OR p_total_project_flats IS NOT NULL
       OR p_builder_share_units IS NOT NULL
       OR p_landowner_share_units IS NOT NULL THEN
      RAISE EXCEPTION 'Self development must not contain landowner, JDA or flat-sharing fields.'
      USING HINT = 'Leave landowner and JDA fields empty for self development.';
    END IF;
  END IF;

  IF v_arrangement_text = 'joint_development' THEN
    IF p_landowner_party_id IS NULL THEN
      RAISE EXCEPTION 'Joint development requires landowner_party_id.'
      USING HINT = 'Provide a landowner party for joint development projects.';
    END IF;

    IF p_total_project_flats IS NULL OR p_total_project_flats <= 0 OR p_total_project_flats <> floor(p_total_project_flats::numeric) THEN
      RAISE EXCEPTION 'Joint development requires total_project_flats as a positive whole number.'
      USING HINT = 'Set total_project_flats to a whole number greater than zero.';
    END IF;

    IF p_builder_share_units IS NULL OR p_landowner_share_units IS NULL THEN
      RAISE EXCEPTION 'Joint development requires builder_share_units and landowner_share_units.'
      USING HINT = 'Provide both share counts.';
    END IF;

    IF p_builder_share_units < 0 OR p_landowner_share_units < 0 THEN
      RAISE EXCEPTION 'Builder and landowner share flats must be non-negative.'
      USING HINT = 'All share counts must be zero or greater.';
    END IF;

    IF p_builder_share_units + p_landowner_share_units <> p_total_project_flats THEN
      RAISE EXCEPTION 'Builder and landowner share flats must add up to the total project flats.'
      USING HINT = 'Use builder_share_units + landowner_share_units = total_project_flats.';
    END IF;
  END IF;

  IF p_stage_drafts IS NOT NULL AND jsonb_typeof(p_stage_drafts) <> 'array' THEN
    RAISE EXCEPTION 'stage_drafts must be a JSON array when provided.'
    USING HINT = 'Provide stage_drafts as an array of stage objects.';
  END IF;

  SELECT enabled_business_models INTO v_enabled_models
  FROM public.company_settings
  WHERE company_id = p_company_id;

  IF v_enabled_models IS NULL OR NOT (v_model_text = ANY (v_enabled_models)) THEN
    RAISE EXCEPTION 'Business model % is not enabled for company %.', v_model_text, p_company_id
    USING HINT = 'Update company_settings.enabled_business_models to include this business model before creating the project.';
  END IF;

  INSERT INTO public.projects (
    company_id,
    customer_id,
    source_document_id,
    project_type_id,
    project_type_snapshot,
    business_model,
    projected_sales_value,
    land_cost,
    development_arrangement,
    total_project_flats,
    landowner_party_id,
    jda_agreement_reference,
    jda_agreement_document_url,
    jda_agreement_date,
    builder_share_units,
    landowner_share_units,
    project_number,
    name,
    description,
    site_address,
    contract_amount,
    budget_amount,
    start_date,
    expected_end_date,
    actual_end_date,
    status,
    created_by
  ) VALUES (
    p_company_id,
    p_customer_id,
    p_source_document_id,
    p_project_type_id,
    p_project_type_snapshot,
    v_model_text,
    p_projected_sales_value,
    p_land_cost,
    CASE WHEN v_model_text = 'property_development' THEN v_arrangement_text ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' THEN p_total_project_flats ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_landowner_party_id ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_reference ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_document_url ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_jda_agreement_date ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_builder_share_units ELSE NULL END,
    CASE WHEN v_model_text = 'property_development' AND v_arrangement_text = 'joint_development' THEN p_landowner_share_units ELSE NULL END,
    p_project_number,
    p_name,
    p_description,
    p_site_address,
    COALESCE(p_contract_amount, 0),
    p_budget_amount,
    p_start_date,
    p_expected_end_date,
    p_actual_end_date,
    COALESCE(p_status, 'planned'),
    p_created_by
  )
  RETURNING id INTO v_project_id;

  v_stage_drafts_supplied := p_stage_drafts IS NOT NULL
    AND jsonb_typeof(p_stage_drafts) = 'array';

  v_has_stage_drafts := v_stage_drafts_supplied
    AND jsonb_array_length(p_stage_drafts) > 0;

  IF v_has_stage_drafts THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_stage_drafts) AS draft(stage_row)
      WHERE jsonb_typeof(draft.stage_row) <> 'object'
         OR NULLIF(trim(draft.stage_row ->> 'name'), '') IS NULL
    ) THEN
      RAISE EXCEPTION 'Each custom stage must be an object with a non-blank name.'
      USING HINT = 'Provide stage entries like {"name":"Foundation", "sequenceNumber":1}.';
    END IF;
  END IF;

  IF p_project_type_id IS NOT NULL THEN
    SELECT code INTO v_project_type_code
    FROM public.project_types
    WHERE id = p_project_type_id;
  END IF;

  IF v_has_stage_drafts THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      planned_start_date,
      planned_end_date,
      completion_percentage,
      status,
      created_by
    )
    SELECT
      v_project_id,
      NULLIF(trim(draft.stage_row ->> 'name'), '') AS name,
      row_number() OVER (
        ORDER BY
          COALESCE(
            CASE
              WHEN COALESCE(draft.stage_row ->> 'sequenceNumber', '') ~ '^[0-9]+$'
                THEN (draft.stage_row ->> 'sequenceNumber')::integer
              ELSE NULL
            END,
            draft.stage_ord
          ),
          draft.stage_ord
      ) AS sequence_number,
      NULLIF(draft.stage_row ->> 'plannedStartDate', '')::date,
      NULLIF(draft.stage_row ->> 'plannedEndDate', '')::date,
      0,
      'pending',
      p_created_by
    FROM jsonb_array_elements(p_stage_drafts) WITH ORDINALITY AS draft(stage_row, stage_ord)
    ;
  ELSIF NOT v_stage_drafts_supplied
    AND p_project_type_id IS NOT NULL
    AND lower(coalesce(v_project_type_code, '')) <> 'other' THEN
    INSERT INTO public.project_stages (
      project_id,
      name,
      sequence_number,
      completion_percentage,
      status,
      created_by
    )
    WITH resolved_templates AS (
      SELECT DISTINCT ON (
        COALESCE(
          NULLIF(lower(trim(template_code)), ''),
          '__null__' || id::text
        )
      )
        template_code,
        name,
        sequence_number,
        company_id,
        updated_at,
        id
      FROM public.project_stage_templates
      WHERE project_type_id = p_project_type_id
        AND business_model = v_model_text
        AND is_active = true
        AND (company_id = p_company_id OR company_id IS NULL)
      ORDER BY
        COALESCE(
          NULLIF(lower(trim(template_code)), ''),
          '__null__' || id::text
        ),
        (company_id = p_company_id) DESC,
        updated_at DESC,
        id DESC
    ),
    ordered_templates AS (
      SELECT
        name,
        row_number() OVER (ORDER BY sequence_number ASC, lower(name) ASC) AS sequence_number
      FROM resolved_templates
    )
    SELECT
      v_project_id,
      ordered_templates.name,
      ordered_templates.sequence_number,
      0,
      'pending',
      p_created_by
    FROM ordered_templates
    ;
  END IF;

  RETURN v_project_id;
END;
$_$;


ALTER FUNCTION public.create_project_with_stages_with_business_model(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb, p_business_model text, p_projected_sales_value numeric, p_land_cost numeric, p_development_arrangement text, p_total_project_flats integer, p_landowner_party_id uuid, p_jda_agreement_reference text, p_jda_agreement_document_url text, p_jda_agreement_date date, p_builder_share_units integer, p_landowner_share_units integer) OWNER TO postgres;

--
-- TOC entry 471 (class 1255 OID 25936)
-- Name: current_app_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_app_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;


ALTER FUNCTION public.current_app_user_id() OWNER TO postgres;

--
-- TOC entry 457 (class 1255 OID 17772)
-- Name: current_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
$$;


ALTER FUNCTION public.current_user_id() OWNER TO postgres;

--
-- TOC entry 500 (class 1255 OID 27817)
-- Name: enforce_invoice_allocation_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_invoice_allocation_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_allocated numeric(18,2);
BEGIN
    SELECT COALESCE(SUM(allocated_amount), 0)
      INTO v_allocated
    FROM public.payment_allocations
    WHERE invoice_id = OLD.id
      AND company_id = OLD.company_id;

    IF v_allocated > NEW.grand_total THEN
        RAISE EXCEPTION
          'Invoice grand_total cannot be lower than its existing allocations. Allocated: %, new total: %.',
          v_allocated, NEW.grand_total;
    END IF;

    IF NEW.status <> 'Issued' AND v_allocated > 0 THEN
        RAISE EXCEPTION
          'An invoice with existing allocations cannot be moved out of Issued status. Reverse its allocations first.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_invoice_allocation_balance() OWNER TO postgres;

--
-- TOC entry 496 (class 1255 OID 27809)
-- Name: enforce_payment_allocation_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_payment_allocation_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_parent_id uuid;
    v_receipt_amount numeric(18,2);
    v_receipt_voided_at timestamptz;
    v_invoice_total numeric(18,2);
    v_invoice_status text;
    v_receipt_allocated numeric(18,2);
    v_invoice_allocated numeric(18,2);
    v_company_id uuid;
    v_exclude_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Serialize deletion with concurrent allocation changes.
        FOR v_parent_id IN
            SELECT DISTINCT x
            FROM unnest(ARRAY[OLD.receipt_id]) AS t(x)
            WHERE x IS NOT NULL
            ORDER BY x
        LOOP
            PERFORM 1
            FROM public.project_receipts
            WHERE id = v_parent_id AND company_id = OLD.company_id
            FOR UPDATE;
        END LOOP;

        FOR v_parent_id IN
            SELECT DISTINCT x
            FROM unnest(ARRAY[OLD.invoice_id]) AS t(x)
            WHERE x IS NOT NULL
            ORDER BY x
        LOOP
            PERFORM 1
            FROM public.invoices
            WHERE id = v_parent_id AND company_id = OLD.company_id
            FOR UPDATE;
        END LOOP;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
        RAISE EXCEPTION 'Changing company_id on a payment allocation is not allowed.';
    END IF;

    v_company_id := NEW.company_id;
    IF TG_OP = 'UPDATE' THEN
        v_exclude_id := OLD.id;
    END IF;

    -- Lock old and new receipt parents in UUID order.
    FOR v_parent_id IN
        SELECT DISTINCT x
        FROM unnest(
            CASE WHEN TG_OP = 'UPDATE'
                 THEN ARRAY[OLD.receipt_id, NEW.receipt_id]
                 ELSE ARRAY[NEW.receipt_id]
            END
        ) AS t(x)
        WHERE x IS NOT NULL
        ORDER BY x
    LOOP
        PERFORM 1
        FROM public.project_receipts
        WHERE id = v_parent_id AND company_id = v_company_id
        FOR UPDATE;
    END LOOP;

    -- Then lock old and new invoice parents in UUID order.
    FOR v_parent_id IN
        SELECT DISTINCT x
        FROM unnest(
            CASE WHEN TG_OP = 'UPDATE'
                 THEN ARRAY[OLD.invoice_id, NEW.invoice_id]
                 ELSE ARRAY[NEW.invoice_id]
            END
        ) AS t(x)
        WHERE x IS NOT NULL
        ORDER BY x
    LOOP
        PERFORM 1
        FROM public.invoices
        WHERE id = v_parent_id AND company_id = v_company_id
        FOR UPDATE;
    END LOOP;

    SELECT amount, voided_at
      INTO v_receipt_amount, v_receipt_voided_at
    FROM public.project_receipts
    WHERE id = NEW.receipt_id AND company_id = v_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receipt not found for this company.';
    END IF;

    IF v_receipt_voided_at IS NOT NULL THEN
        RAISE EXCEPTION 'A voided receipt cannot have payment allocations.';
    END IF;

    SELECT grand_total, status
      INTO v_invoice_total, v_invoice_status
    FROM public.invoices
    WHERE id = NEW.invoice_id AND company_id = v_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found for this company.';
    END IF;

    IF v_invoice_status <> 'Issued' THEN
        RAISE EXCEPTION 'Only issued invoices can have payment allocations.';
    END IF;

    SELECT COALESCE(SUM(allocated_amount), 0)
      INTO v_receipt_allocated
    FROM public.payment_allocations
    WHERE receipt_id = NEW.receipt_id
      AND company_id = v_company_id
      AND (v_exclude_id IS NULL OR id <> v_exclude_id);

    SELECT COALESCE(SUM(allocated_amount), 0)
      INTO v_invoice_allocated
    FROM public.payment_allocations
    WHERE invoice_id = NEW.invoice_id
      AND company_id = v_company_id
      AND (v_exclude_id IS NULL OR id <> v_exclude_id);

    IF v_receipt_allocated + NEW.allocated_amount > v_receipt_amount THEN
        RAISE EXCEPTION
          'Allocation exceeds the receipt balance. Available: %, requested: %.',
          v_receipt_amount - v_receipt_allocated, NEW.allocated_amount;
    END IF;

    IF v_invoice_allocated + NEW.allocated_amount > v_invoice_total THEN
        RAISE EXCEPTION
          'Allocation exceeds the invoice outstanding amount. Available: %, requested: %.',
          v_invoice_total - v_invoice_allocated, NEW.allocated_amount;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_payment_allocation_balance() OWNER TO postgres;

--
-- TOC entry 498 (class 1255 OID 27813)
-- Name: enforce_project_expense_bill_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_project_expense_bill_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_paid_total numeric(18,2);
BEGIN
    IF NEW.bill_amount IS NOT DISTINCT FROM OLD.bill_amount
       AND NEW.status IS NOT DISTINCT FROM OLD.status
       AND NEW.voided_at IS NOT DISTINCT FROM OLD.voided_at THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(amount), 0)
      INTO v_paid_total
    FROM public.project_expense_payments
    WHERE project_expense_id = OLD.id
      AND company_id = OLD.company_id
      AND voided_at IS NULL;

    IF v_paid_total > NEW.bill_amount THEN
        RAISE EXCEPTION
          'Bill amount cannot be lower than active payments. Active payments: %, new bill amount: %.',
          v_paid_total, NEW.bill_amount;
    END IF;

    IF (NEW.status = 'void' OR NEW.voided_at IS NOT NULL)
       AND v_paid_total > 0 THEN
        RAISE EXCEPTION
          'An expense with active payments cannot be voided. Void or reverse its payments first.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_project_expense_bill_balance() OWNER TO postgres;

--
-- TOC entry 497 (class 1255 OID 27811)
-- Name: enforce_project_expense_payment_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_project_expense_payment_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_expense_id uuid;
    v_company_id uuid;
    v_bill_amount numeric(18,2);
    v_expense_status text;
    v_expense_voided_at timestamptz;
    v_paid_total numeric(18,2);
    v_exclude_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM 1
        FROM public.project_expenses
        WHERE id = OLD.project_expense_id AND company_id = OLD.company_id
        FOR UPDATE;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
        RAISE EXCEPTION 'Changing company_id on an expense payment is not allowed.';
    END IF;

    v_expense_id := NEW.project_expense_id;
    v_company_id := NEW.company_id;
    IF TG_OP = 'UPDATE' THEN
        v_exclude_id := OLD.id;
    END IF;

    PERFORM 1
    FROM public.project_expenses
    WHERE id = v_expense_id AND company_id = v_company_id
    FOR UPDATE;

    SELECT bill_amount, status, voided_at
      INTO v_bill_amount, v_expense_status, v_expense_voided_at
    FROM public.project_expenses
    WHERE id = v_expense_id AND company_id = v_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense not found for this company.';
    END IF;

    -- Voiding a payment is allowed; it no longer counts toward the paid total.
    IF NEW.voided_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF v_expense_status = 'void' OR v_expense_voided_at IS NOT NULL THEN
        RAISE EXCEPTION 'Payments cannot be added to a voided expense.';
    END IF;

    SELECT COALESCE(SUM(amount), 0)
      INTO v_paid_total
    FROM public.project_expense_payments
    WHERE project_expense_id = v_expense_id
      AND company_id = v_company_id
      AND voided_at IS NULL
      AND (v_exclude_id IS NULL OR id <> v_exclude_id);

    IF v_paid_total + NEW.amount > v_bill_amount THEN
        RAISE EXCEPTION
          'Payment exceeds the expense outstanding amount. Available: %, requested: %.',
          v_bill_amount - v_paid_total, NEW.amount;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_project_expense_payment_balance() OWNER TO postgres;

--
-- TOC entry 499 (class 1255 OID 27815)
-- Name: enforce_project_receipt_allocation_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_project_receipt_allocation_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_allocated numeric(18,2);
BEGIN
    SELECT COALESCE(SUM(allocated_amount), 0)
      INTO v_allocated
    FROM public.payment_allocations
    WHERE receipt_id = OLD.id
      AND company_id = OLD.company_id;

    IF v_allocated > NEW.amount THEN
        RAISE EXCEPTION
          'Receipt amount cannot be lower than its existing allocations. Allocated: %, new amount: %.',
          v_allocated, NEW.amount;
    END IF;

    IF NEW.voided_at IS NOT NULL AND v_allocated > 0 THEN
        RAISE EXCEPTION
          'A receipt with existing allocations cannot be voided. Reverse its allocations first.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_project_receipt_allocation_balance() OWNER TO postgres;

--
-- TOC entry 458 (class 1255 OID 17879)
-- Name: next_document_sequence(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.next_document_sequence(p_company_id uuid, p_document_type text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_value integer;
BEGIN
  INSERT INTO public.document_sequences (company_id, document_type, current_sequence)
  VALUES (p_company_id, p_document_type, 1)
  ON CONFLICT (company_id, document_type)
  DO UPDATE SET
    current_sequence = public.document_sequences.current_sequence + 1,
    updated_at = now()
  RETURNING current_sequence INTO next_value;

  RETURN next_value;
END;
$$;


ALTER FUNCTION public.next_document_sequence(p_company_id uuid, p_document_type text) OWNER TO postgres;

--
-- TOC entry 491 (class 1255 OID 27678)
-- Name: save_quotation(uuid, jsonb, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_quotation(p_company_id uuid, p_payload jsonb, p_expected_version integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id        uuid := NULLIF(p_payload->>'id', '')::uuid;
  v_existing  public.documents%ROWTYPE;
  v_is_new    boolean;
  v_number    text;
  v_status    text := COALESCE(NULLIF(p_payload->>'status', ''), 'Draft');

  v_sub       numeric(18,2);
  v_add       numeric(18,2);
  v_base      numeric(18,2);
  v_dtype     text := COALESCE(NULLIF(p_payload->>'discount_type', ''), 'None');
  v_dval      numeric(18,2) := COALESCE(NULLIF(p_payload->>'discount_value', '')::numeric, 0);
  v_damt      numeric(18,2);
  v_tax_on    boolean := COALESCE((p_payload->>'tax_applicable')::boolean, false);
  v_tax_rate  numeric(5,2) := COALESCE(NULLIF(p_payload->>'tax_percentage', '')::numeric, 0);
  v_taxable   numeric(18,2);
  v_tax       numeric(18,2);
  v_grand     numeric(18,2);
  v_pay_pct   numeric;

  v_brand     jsonb;
  v_version   integer;
  v_section   jsonb;
  v_sec_id    uuid;
  v_sec_ord   integer;
  v_new_id    uuid;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Quotation id is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing FROM public.documents WHERE id = v_id FOR UPDATE;
  v_is_new := NOT FOUND;

  IF NOT v_is_new THEN
    IF v_existing.company_id <> p_company_id THEN
      RAISE EXCEPTION 'This document belongs to a different company.' USING ERRCODE = '42501';
    END IF;
    IF v_existing.document_type <> 'Quotation' THEN
      RAISE EXCEPTION 'This document is not a quotation.' USING ERRCODE = '22023';
    END IF;
    IF v_existing.is_deleted THEN
      RAISE EXCEPTION 'This quotation has been deleted and can no longer be modified.' USING ERRCODE = 'P0409';
    END IF;
    IF p_expected_version IS NOT NULL AND v_existing.version <> p_expected_version THEN
      RAISE EXCEPTION 'This quotation was changed elsewhere. Reload it before saving.'
        USING ERRCODE = '40001', DETAIL = format('current_version=%s', v_existing.version);
    END IF;
    v_number := v_existing.document_number;
  ELSE
    v_number := public.allocate_document_number(p_company_id, 'Quotation');
  END IF;

  SELECT COALESCE(SUM(round(COALESCE(NULLIF(i->>'quantity', '')::numeric, 0)
                          * COALESCE(NULLIF(i->>'rate', '')::numeric, 0), 2)), 0)
    INTO v_sub
  FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) s,
       jsonb_array_elements(COALESCE(s->'items', '[]'::jsonb)) i
  WHERE COALESCE(i->>'row_type', 'item') = 'item';

  SELECT COALESCE(SUM(round(COALESCE(NULLIF(c->>'amount', '')::numeric, 0), 2)), 0)
    INTO v_add
  FROM jsonb_array_elements(COALESCE(p_payload->'additional_charge_items', '[]'::jsonb)) c;

  IF v_dtype NOT IN ('None', 'Percentage', 'Fixed Amount') THEN
    RAISE EXCEPTION 'Invalid discount type: %', v_dtype USING ERRCODE = '22023';
  END IF;
  IF v_dval < 0 OR (v_dtype = 'Percentage' AND v_dval > 100) THEN
    RAISE EXCEPTION 'Invalid discount value.' USING ERRCODE = '22023';
  END IF;

  v_base := v_sub + v_add;
  v_damt := CASE v_dtype
              WHEN 'Percentage'   THEN round(v_base * v_dval / 100, 2)
              WHEN 'Fixed Amount' THEN round(v_dval, 2)
              ELSE 0 END;
  IF v_dtype = 'None' THEN v_dval := 0; END IF;
  IF v_damt > v_base THEN
    RAISE EXCEPTION 'Discount amount cannot exceed subtotal.' USING ERRCODE = '22023';
  END IF;

  v_taxable := v_base - v_damt;
  IF NOT v_tax_on THEN v_tax_rate := 0; END IF;
  v_tax   := CASE WHEN v_tax_rate > 0 THEN round(v_taxable * v_tax_rate / 100, 2) ELSE 0 END;
  v_grand := v_taxable + v_tax;

  SELECT COALESCE(SUM(NULLIF(p->>'percentage', '')::numeric), 0)
    INTO v_pay_pct
  FROM jsonb_array_elements(COALESCE(p_payload->'payment_schedule', '[]'::jsonb)) p;
  IF v_pay_pct > 100.0001 THEN
    RAISE EXCEPTION 'Payment schedule adds up to more than 100%%.' USING ERRCODE = '22023';
  END IF;

  IF v_status = 'Draft' THEN
    v_brand := NULL;
  ELSIF NOT v_is_new AND v_existing.brand_snapshot IS NOT NULL THEN
    v_brand := v_existing.brand_snapshot;
  ELSE
    SELECT jsonb_strip_nulls(jsonb_build_object(
             'companyName', c.name,         'logoUrl', c.logo_url,
             'primaryColor', c.primary_color, 'secondaryColor', c.secondary_color,
             'address', c.address,          'mobile', c.phone,
             'email', c.email,              'website', c.website,
             'gstin', c.gst_number,         'pan', c.pan_number,
             'bankName', s.bank_name,       'accountName', s.account_name,
             'accountNumber', s.account_number, 'ifsc', s.ifsc,
             'branch', s.branch,            'upiId', s.upi_id,
             'authorizedPersonName', s.authorized_person, 'designation', s.designation,
             'signatureImage', s.signature_url,
             'snapshotAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))
      INTO v_brand
    FROM public.companies c
    LEFT JOIN public.company_settings s ON s.company_id = c.id
    WHERE c.id = p_company_id;
  END IF;

  INSERT INTO public.documents AS d (
    id, company_id, customer_id, party_id, document_type, document_number, status,
    quotation_date, valid_until, project_type_id, project_name, project_type, project_location,
    area_unit_id, builtup_area, area_unit, floors,
    subtotal, additional_charges, discount, discount_type, discount_amount,
    tax_rate_id, tax_name, tax_percentage, tax_amount, grand_total,
    notes, internal_notes, validity, questionnaire, additional_charge_items, brand_snapshot,
    version, created_at, updated_at
  ) VALUES (
    v_id, p_company_id, NULLIF(p_payload->>'customer_id', '')::uuid, NULLIF(p_payload->>'party_id', '')::uuid,
    'Quotation', v_number, v_status,
    NULLIF(p_payload->>'quotation_date', '')::date, NULLIF(p_payload->>'valid_until', '')::date,
    NULLIF(p_payload->>'project_type_id', '')::uuid,
    COALESCE(p_payload->>'project_name', ''), COALESCE(p_payload->>'project_type', ''),
    COALESCE(p_payload->>'project_location', ''),
    NULLIF(p_payload->>'area_unit_id', '')::uuid, NULLIF(p_payload->>'builtup_area', '')::numeric,
    COALESCE(p_payload->>'area_unit', ''), COALESCE(p_payload->>'floors', ''),
    v_sub, v_add, v_dval, v_dtype, v_damt,
    NULLIF(p_payload->>'tax_rate_id', '')::uuid, NULLIF(p_payload->>'tax_name', ''), v_tax_rate, v_tax, v_grand,
    COALESCE(p_payload->>'notes', ''), COALESCE(p_payload->>'internal_notes', ''),
    NULLIF(p_payload->>'validity', ''),
    CASE WHEN jsonb_typeof(p_payload->'questionnaire') = 'object' THEN p_payload->'questionnaire' END,
    COALESCE(p_payload->'additional_charge_items', '[]'::jsonb), v_brand,
    1, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id, party_id = EXCLUDED.party_id, status = EXCLUDED.status,
    quotation_date = EXCLUDED.quotation_date, valid_until = EXCLUDED.valid_until,
    project_type_id = EXCLUDED.project_type_id, project_name = EXCLUDED.project_name,
    project_type = EXCLUDED.project_type, project_location = EXCLUDED.project_location,
    area_unit_id = EXCLUDED.area_unit_id, builtup_area = EXCLUDED.builtup_area,
    area_unit = EXCLUDED.area_unit, floors = EXCLUDED.floors,
    subtotal = EXCLUDED.subtotal, additional_charges = EXCLUDED.additional_charges,
    discount = EXCLUDED.discount, discount_type = EXCLUDED.discount_type,
    discount_amount = EXCLUDED.discount_amount,
    tax_rate_id = EXCLUDED.tax_rate_id, tax_name = EXCLUDED.tax_name,
    tax_percentage = EXCLUDED.tax_percentage, tax_amount = EXCLUDED.tax_amount,
    grand_total = EXCLUDED.grand_total, notes = EXCLUDED.notes,
    internal_notes = EXCLUDED.internal_notes, validity = EXCLUDED.validity,
    questionnaire = EXCLUDED.questionnaire, additional_charge_items = EXCLUDED.additional_charge_items,
    brand_snapshot = EXCLUDED.brand_snapshot,
    version = d.version + 1, updated_at = now()
  RETURNING d.version INTO v_version;

  DELETE FROM public.document_sections       WHERE document_id = v_id;
  DELETE FROM public.document_terms          WHERE document_id = v_id;
  DELETE FROM public.document_specifications WHERE document_id = v_id;
  DELETE FROM public.document_inclusions     WHERE document_id = v_id;
  DELETE FROM public.document_exclusions     WHERE document_id = v_id;
  DELETE FROM public.payment_schedules       WHERE document_id = v_id;

  v_sec_ord := 0;
  FOR v_section IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) LOOP
    v_new_id := NULLIF(v_section->>'id', '')::uuid;
    IF v_new_id IS NULL OR EXISTS (SELECT 1 FROM public.document_sections WHERE id = v_new_id) THEN
      v_new_id := gen_random_uuid();
    END IF;

    INSERT INTO public.document_sections (id, document_id, section_name, display_order)
    VALUES (
      v_new_id,
      v_id,
      v_section->>'section_name',
      COALESCE(NULLIF(v_section->>'display_order', '')::integer, v_sec_ord)
    )
    RETURNING id INTO v_sec_id;

    INSERT INTO public.document_items (id, section_id, description, quantity, unit_id, unit, rate, amount, display_order, row_type)
    SELECT CASE WHEN NULLIF(t.i->>'id', '') IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM public.document_items x WHERE x.id = (t.i->>'id')::uuid)
                THEN (t.i->>'id')::uuid ELSE gen_random_uuid() END,
           v_sec_id,
           t.i->>'description',
           t.qty,
           NULLIF(t.i->>'unit_id', '')::uuid,
           NULLIF(t.i->>'unit', ''),
           t.rate,
           CASE WHEN t.rtype = 'item' THEN round(t.qty * t.rate, 2) ELSE 0 END,
           COALESCE(NULLIF(t.i->>'display_order', '')::integer, (t.ord - 1)::integer),
           t.rtype
    FROM (
      SELECT i, ord,
             COALESCE(NULLIF(i->>'quantity', '')::numeric, 0) AS qty,
             COALESCE(NULLIF(i->>'rate', '')::numeric, 0)     AS rate,
             CASE
               WHEN i->>'row_type' IN ('item', 'note') THEN i->>'row_type'
               WHEN COALESCE(NULLIF(i->>'quantity', '')::numeric, 0) = 0
                AND COALESCE(NULLIF(i->>'rate', '')::numeric, 0) = 0 THEN 'note'
               ELSE 'item'
             END AS rtype
      FROM jsonb_array_elements(COALESCE(v_section->'items', '[]'::jsonb)) WITH ORDINALITY AS e(i, ord)
    ) t;

    v_sec_ord := v_sec_ord + 1;
  END LOOP;

  INSERT INTO public.document_specifications (id, document_id, specification_type, description, display_order)
  SELECT CASE WHEN NULLIF(e.s->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.document_specifications x WHERE x.id = (e.s->>'id')::uuid)
             THEN (e.s->>'id')::uuid ELSE gen_random_uuid() END, v_id,
         e.s->>'specification_type', e.s->>'description',
         COALESCE(NULLIF(e.s->>'display_order', '')::integer, (e.ord - 1)::integer)
  FROM jsonb_array_elements(COALESCE(p_payload->'specifications', '[]'::jsonb)) WITH ORDINALITY AS e(s, ord);

  INSERT INTO public.document_inclusions (document_id, description, display_order)
  SELECT v_id, btrim(e.txt), (e.ord - 1)::integer
  FROM jsonb_array_elements_text(COALESCE(p_payload->'inclusions', '[]'::jsonb)) WITH ORDINALITY AS e(txt, ord)
  WHERE btrim(e.txt) <> '';

  INSERT INTO public.document_exclusions (document_id, description, display_order)
  SELECT v_id, btrim(e.txt), (e.ord - 1)::integer
  FROM jsonb_array_elements_text(COALESCE(p_payload->'exclusions', '[]'::jsonb)) WITH ORDINALITY AS e(txt, ord)
  WHERE btrim(e.txt) <> '';

  -- Payment schedule: every percentage-based stage is rounded normally EXCEPT the last
  -- one (by display order among percentage-based stages), which absorbs whatever
  -- rounding residue is left so the set always sums to exactly
  -- round(total_pct * grand_total / 100, 2) — never off by a paisa from independent
  -- per-row rounding. A stage given an explicit amount (no percentage) passes through
  -- untouched; it isn't part of this reconciliation.
  WITH schedule AS (
    SELECT e.p, e.ord, NULLIF(e.p->>'percentage', '')::numeric AS pct
    FROM jsonb_array_elements(COALESCE(p_payload->'payment_schedule', '[]'::jsonb)) WITH ORDINALITY AS e(p, ord)
  ), pct_rows AS (
    SELECT ord, pct, round(v_grand * pct / 100, 2) AS naive_amount,
           row_number() OVER (ORDER BY ord DESC) AS rn_from_end
    FROM schedule WHERE pct IS NOT NULL
  ), pct_totals AS (
    SELECT COALESCE(SUM(pct), 0) AS total_pct,
           COALESCE(SUM(naive_amount) FILTER (WHERE rn_from_end <> 1), 0) AS sum_of_others
    FROM pct_rows
  )
  INSERT INTO public.payment_schedules (id, document_id, stage_name, percentage, amount, due_date, status, notes, display_order)
  SELECT CASE WHEN NULLIF(s.p->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.payment_schedules x WHERE x.id = (s.p->>'id')::uuid)
             THEN (s.p->>'id')::uuid ELSE gen_random_uuid() END,
         v_id,
         s.p->>'stage_name',
         s.pct,
         CASE
           WHEN s.pct IS NULL THEN NULLIF(s.p->>'amount', '')::numeric
           WHEN pr.rn_from_end = 1 THEN round(v_grand * t.total_pct / 100, 2) - t.sum_of_others
           ELSE pr.naive_amount
         END,
         NULLIF(s.p->>'due_date', '')::date,
         NULLIF(s.p->>'status', ''),
         NULLIF(s.p->>'notes', ''),
         COALESCE(NULLIF(s.p->>'display_order', '')::integer, (s.ord - 1)::integer)
  FROM schedule s
  LEFT JOIN pct_rows pr ON pr.ord = s.ord
  CROSS JOIN pct_totals t
  ORDER BY s.ord;

  INSERT INTO public.document_terms (id, document_id, description, display_order)
  SELECT CASE WHEN NULLIF(e.t->>'id', '') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.document_terms x WHERE x.id = (e.t->>'id')::uuid)
             THEN (e.t->>'id')::uuid ELSE gen_random_uuid() END, v_id,
         e.t->>'description',
         COALESCE(NULLIF(e.t->>'display_order', '')::integer, (e.ord - 1)::integer)
  FROM jsonb_array_elements(COALESCE(p_payload->'terms', '[]'::jsonb)) WITH ORDINALITY AS e(t, ord);

  RETURN jsonb_build_object(
    'id', v_id,
    'document_number', v_number,
    'version', v_version,
    'is_new', v_is_new,
    'subtotal', v_sub,
    'additional_charges', v_add,
    'discount_amount', v_damt,
    'taxable_amount', v_taxable,
    'tax_amount', v_tax,
    'grand_total', v_grand
  );
END;
$$;


ALTER FUNCTION public.save_quotation(p_company_id uuid, p_payload jsonb, p_expected_version integer) OWNER TO postgres;

--
-- TOC entry 495 (class 1255 OID 27796)
-- Name: set_material_receipt_line_purchase_order(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_material_receipt_line_purchase_order() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_receipt_po_id uuid;
  v_line_po_id uuid;
BEGIN
  SELECT purchase_order_id
    INTO v_receipt_po_id
  FROM public.material_receipts
  WHERE id = NEW.material_receipt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material receipt % was not found.', NEW.material_receipt_id;
  END IF;

  SELECT purchase_order_id
    INTO v_line_po_id
  FROM public.purchase_order_lines
  WHERE id = NEW.purchase_order_line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order line % was not found.', NEW.purchase_order_line_id;
  END IF;

  IF v_receipt_po_id <> v_line_po_id THEN
    RAISE EXCEPTION
      'Purchase order line % does not belong to the purchase order for material receipt %.',
      NEW.purchase_order_line_id, NEW.material_receipt_id;
  END IF;

  NEW.purchase_order_id := v_receipt_po_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_material_receipt_line_purchase_order() OWNER TO postgres;

--
-- TOC entry 470 (class 1255 OID 25935)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- TOC entry 474 (class 1255 OID 26806)
-- Name: validate_attachment_links(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_attachment_links() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  upd_project uuid;
  exp_project uuid;
BEGIN
  IF NEW.progress_update_id IS NOT NULL THEN
    SELECT project_id INTO upd_project
    FROM public.project_progress_updates
    WHERE id = NEW.progress_update_id;

    IF upd_project IS NULL OR upd_project <> NEW.project_id THEN
      RAISE EXCEPTION 'progress_update_id must belong to same project_id';
    END IF;
  END IF;

  IF NEW.expense_id IS NOT NULL THEN
    SELECT project_id INTO exp_project
    FROM public.project_expenses
    WHERE id = NEW.expense_id;

    IF exp_project IS NULL OR exp_project <> NEW.project_id THEN
      RAISE EXCEPTION 'expense_id must belong to same project_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_attachment_links() OWNER TO postgres;

--
-- TOC entry 476 (class 1255 OID 26808)
-- Name: validate_document_customer_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_document_customer_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  c_company uuid;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO c_company
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF c_company IS NULL OR c_company <> NEW.company_id THEN
    RAISE EXCEPTION 'documents.customer_id must belong to same company_id';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_document_customer_scope() OWNER TO postgres;

--
-- TOC entry 482 (class 1255 OID 26814)
-- Name: validate_document_item_unit_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_document_item_unit_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  d_company uuid;
  ok_count integer;
BEGIN
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT d.company_id
  INTO d_company
  FROM public.document_sections s
  JOIN public.documents d ON d.id = s.document_id
  WHERE s.id = NEW.section_id;

  SELECT count(*) INTO ok_count
  FROM public.units_of_measure
  WHERE id = NEW.unit_id
    AND is_active = true
    AND (company_id = d_company OR company_id IS NULL);

  IF ok_count = 0 THEN
    RAISE EXCEPTION 'unit_id is not allowed for this document company';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_document_item_unit_scope() OWNER TO postgres;

--
-- TOC entry 475 (class 1255 OID 26807)
-- Name: validate_document_master_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_document_master_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  ok_count integer;
BEGIN
  IF NEW.project_type_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.project_types
    WHERE id = NEW.project_type_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'project_type_id is not allowed for this company';
    END IF;
  END IF;

  IF NEW.area_unit_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.units_of_measure
    WHERE id = NEW.area_unit_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'area_unit_id is not allowed for this company';
    END IF;
  END IF;

  IF NEW.tax_rate_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.tax_rates
    WHERE id = NEW.tax_rate_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'tax_rate_id is not allowed for this company';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_document_master_scope() OWNER TO postgres;

--
-- TOC entry 480 (class 1255 OID 26812)
-- Name: validate_expense_master_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_expense_master_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    ok_count integer;
BEGIN
    IF NEW.category_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO ok_count
    FROM public.expense_categories
    WHERE id = NEW.category_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);

    IF ok_count = 0 THEN
        RAISE EXCEPTION 'category_id is not allowed for this company';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_expense_master_scope() OWNER TO postgres;

--
-- TOC entry 481 (class 1255 OID 26813)
-- Name: validate_payment_method_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_payment_method_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    p_company uuid;
    ok_count integer;
BEGIN
    IF NEW.payment_method_id IS NULL THEN
        RETURN NEW;
    END IF;

    p_company := NEW.company_id;

    SELECT count(*) INTO ok_count
    FROM public.payment_methods
    WHERE id = NEW.payment_method_id
      AND is_active = true
      AND (company_id = p_company OR company_id IS NULL);

    IF ok_count = 0 THEN
        RAISE EXCEPTION 'payment_method_id is not allowed for this company';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_payment_method_scope() OWNER TO postgres;

--
-- TOC entry 473 (class 1255 OID 26805)
-- Name: validate_progress_stage_link(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_progress_stage_link() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  st_project uuid;
BEGIN
  IF NEW.stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT project_id INTO st_project
  FROM public.project_stages
  WHERE id = NEW.stage_id;

  IF st_project IS NULL OR st_project <> NEW.project_id THEN
    RAISE EXCEPTION 'stage_id must belong to same project_id';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_progress_stage_link() OWNER TO postgres;

--
-- TOC entry 478 (class 1255 OID 26810)
-- Name: validate_project_customer_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_project_customer_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  c_company uuid;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO c_company
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF c_company IS NULL OR c_company <> NEW.company_id THEN
    RAISE EXCEPTION 'projects.customer_id must belong to same company_id';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_project_customer_scope() OWNER TO postgres;

--
-- TOC entry 477 (class 1255 OID 26809)
-- Name: validate_project_master_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_project_master_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  ok_count integer;
BEGIN
  IF NEW.project_type_id IS NOT NULL THEN
    SELECT count(*) INTO ok_count
    FROM public.project_types
    WHERE id = NEW.project_type_id
      AND is_active = true
      AND (company_id = NEW.company_id OR company_id IS NULL);
    IF ok_count = 0 THEN
      RAISE EXCEPTION 'project_type_id is not allowed for this company';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_project_master_scope() OWNER TO postgres;

--
-- TOC entry 472 (class 1255 OID 26804)
-- Name: validate_project_source_quotation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_project_source_quotation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  src public.documents%ROWTYPE;
BEGIN
  IF NEW.source_document_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO src
  FROM public.documents
  WHERE id = NEW.source_document_id
    AND company_id = NEW.company_id
    AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'source_document_id not found in same company';
  END IF;

  IF src.document_type <> 'Quotation' THEN
    RAISE EXCEPTION 'source_document_id must reference document_type Quotation';
  END IF;

  IF src.status <> 'Accepted' THEN
    RAISE EXCEPTION 'Only Accepted quotation can be used for conversion';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_project_source_quotation() OWNER TO postgres;

--
-- TOC entry 479 (class 1255 OID 26811)
-- Name: validate_stage_template_scope(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_stage_template_scope() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  pt_company uuid;
BEGIN
  IF NEW.project_type_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT company_id INTO pt_company
  FROM public.project_types
  WHERE id = NEW.project_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_stage_templates.project_type_id not found';
  END IF;

  -- Global template must reference a global project type.
  IF NEW.company_id IS NULL AND pt_company IS NOT NULL THEN
    RAISE EXCEPTION 'global stage template cannot reference a company project type';
  END IF;

  -- Company template may reference its own type or a global type.
  IF NEW.company_id IS NOT NULL AND pt_company IS NOT NULL AND pt_company <> NEW.company_id THEN
    RAISE EXCEPTION 'company stage template cannot reference another company project type';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_stage_template_scope() OWNER TO postgres;

--
-- TOC entry 431 (class 1255 OID 17224)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- TOC entry 469 (class 1255 OID 25594)
-- Name: authorize(text, text, text, text, text, text[], text[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) RETURNS record
    LANGUAGE plpgsql
    AS $$
declare
  probe_ids uuid[];
  probe_inserted_at timestamp := now() at time zone 'utc';
  visible_ids uuid[];
  ext text;
  allowed boolean;
begin
  -- The probe inserts are rolled back, but they still give the transaction an xid, so it ends
  -- in a commit. Nothing durable was written, so skip waiting on the WAL flush and sync standbys.
  -- Set outside the block below, whose rollback would undo it.
  perform set_config('synchronous_commit', 'off', true);

  -- The RAISE at the end of this block rolls back everything in it.
  begin
    probe_ids := array(select gen_random_uuid() from unnest(read_extensions));

    insert into realtime.messages (id, topic, extension, inserted_at, updated_at)
    select p.id, topic_name, p.extension, probe_inserted_at, probe_inserted_at
    from unnest(probe_ids, read_extensions) as p(id, extension);

    perform set_config('role', role_name, true),
            set_config('realtime.topic', topic_name, true),
            set_config('request.jwt.claims', claims, true),
            set_config('request.jwt.claim.sub', sub, true),
            set_config('request.jwt.claim.role', role_name, true),
            set_config('request.headers', headers, true);

    -- One lookup for every probe, by the full primary key.
    visible_ids := array(
      select m.id
      from realtime.messages m
      where m.inserted_at = probe_inserted_at
        and m.id = any(probe_ids));

    read_allowed := array(
      select p.id = any(visible_ids)
      from unnest(probe_ids) with ordinality as p(id, n)
      order by p.n);

    write_allowed := '{}';

    foreach ext in array write_extensions loop
      begin
        insert into realtime.messages (topic, extension, inserted_at, updated_at)
        values (topic_name, ext, now() at time zone 'utc', now() at time zone 'utc');

        allowed := true;
      exception when insufficient_privilege then
        allowed := false;
      end;

      write_allowed := write_allowed || allowed;
    end loop;

    raise sqlstate 'RTA01';
  exception when sqlstate 'RTA01' then
    null;
  end;
end;
$$;


ALTER FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 432 (class 1255 OID 17227)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 433 (class 1255 OID 17228)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 434 (class 1255 OID 17229)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_realtime_admin;

--
-- TOC entry 435 (class 1255 OID 17230)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 436 (class 1255 OID 17231)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 437 (class 1255 OID 17232)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 438 (class 1255 OID 17233)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- TOC entry 468 (class 1255 OID 25592)
-- Name: list_changes_sync(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures the slot is read exactly once.
  consumed AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         realtime.settled_changes(
           slot_name, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM consumed
    WHERE consumed.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM consumed,
         realtime.apply_rls(
           wal := consumed.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE consumed.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- TOC entry 439 (class 1255 OID 17234)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_realtime_admin;

--
-- TOC entry 440 (class 1255 OID 17235)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 441 (class 1255 OID 17236)
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 467 (class 1255 OID 25590)
-- Name: settled_changes(name, integer, text[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) RETURNS TABLE(lsn pg_lsn, xid xid, data text)
    LANGUAGE plpgsql
    AS $$
declare
  upto pg_lsn;
  total bigint;
  xids xid[];
  starts bigint[];
  snapshot pg_snapshot;
  running_xids xid[];
  xmax_age int;
  cut bigint;
begin
  -- Each statement in a volatile function takes its own snapshot, which is what lets the
  -- check below see a writer that was still in flight when the peek ran. Under REPEATABLE
  -- READ the snapshot never advances, so a deferred change would never be released.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'realtime.settled_changes requires READ COMMITTED';
  end if;

  -- The peek and the read below cover the same WAL, so the read cannot reach a commit the
  -- check never saw.
  upto := pg_current_wal_flush_lsn();

  -- One entry per transaction, in commit order: its xid and the position of its first
  -- change. The peek uses the caller's own options, so max_changes counts exactly what the
  -- read counts. A non-transactional logical message is emitted as soon as it is decoded,
  -- tagged with the xid of whatever transaction wrote it, so it does not mark where that
  -- transaction starts.
  select coalesce(sum(g.n), 0),
         array_agg(g.x order by g.first) filter (where g.first is not null),
         array_agg(g.first order by g.first) filter (where g.first is not null)
    into total, xids, starts
    from (
      select p.xid as x, count(*) as n,
             min(p.ord) filter (where not case
               when starts_with(p.data, '{"action":"M"') then (p.data::jsonb->>'transactional')::boolean is false
               else false
             end) as first
      from pg_logical_slot_peek_changes(slot_name, upto, max_changes, variadic opts)
           with ordinality as p(lsn, xid, data, ord)
      group by p.xid
    ) g;

  -- Nothing for the caller, but the slot still has to move past what the peek covered.
  if total = 0 then
    perform pg_replication_slot_advance(slot_name, upto);
    return;
  end if;

  if xids is not null then
    -- Taken after the peek is materialized, so a writer that was still in flight during
    -- decoding is guaranteed to show up here.
    snapshot := pg_current_snapshot();

    -- A commit record reaches the WAL before the writer leaves the proc array, so a change
    -- can be decoded while its row is invisible. apply_rls would resolve a policy against a
    -- row it cannot see and authorize it for nobody, while the read consumed it regardless.
    --
    -- xip lists transactions running when the snapshot was taken. It does not cover a writer
    -- whose xid sits at or beyond xmax, which never appears there, so the horizon is checked
    -- too. age() counts backwards from the current xid and so compares correctly across
    -- wraparound.
    select coalesce(array_agg(running.x::xid), array[]::xid[])
      into running_xids
      from pg_snapshot_xip(snapshot) running(x);
    xmax_age := age(pg_snapshot_xmax(snapshot)::xid);

    select min(u.s) into cut
      from unnest(xids, starts) as u(x, s)
      where u.x = any(running_xids) or age(u.x) <= xmax_age;
  end if;

  -- The read stops right after the commit that brings its count to upto_nchanges, so the
  -- count of changes in front of the first unsettled transaction stops it just before that
  -- transaction.
  if cut is null then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, max_changes, variadic opts) p;
  elsif cut > 1 then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, (cut - 1)::int, variadic opts) p;
  end if;
end;
$$;


ALTER FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 442 (class 1255 OID 17237)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are treated
    -- as the same subscription group in apply_rls. Preserve an empty array as '{}'
    -- ("primary keys only") so it stays distinct from NULL ("all columns"); array_agg
    -- over an empty set would otherwise collapse '{}' back to NULL.
    if new.selected_columns is not null then
        new.selected_columns = coalesce(
            (
                select array_agg(c order by c)
                from unnest(new.selected_columns) c
            ),
            '{}'::text[]
        );
    end if;

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin;

--
-- TOC entry 443 (class 1255 OID 17240)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 444 (class 1255 OID 17241)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- TOC entry 445 (class 1255 OID 17242)
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 456 (class 1255 OID 17474)
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 455 (class 1255 OID 17473)
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- TOC entry 450 (class 1255 OID 17349)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- TOC entry 488 (class 1255 OID 27533)
-- Name: delete_lifecycle_objects(uuid[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) RETURNS TABLE(id uuid, is_delete_marker boolean, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    object_id uuid;
    deleted_row storage.objects%ROWTYPE;
    deleted_ids uuid[];
    deleted_markers boolean[];
    deleted_metadata jsonb[];
    bulk_deleted boolean := false;
BEGIN
    -- Surface pre-existing deferred violations instead of treating them as blocked rows.
    SET CONSTRAINTS ALL IMMEDIATE;
    PERFORM set_config('storage.allow_delete_query', 'true', true);

    -- One subxact keeps the subxid cache from overflowing; rows return only once it commits.
    BEGIN
        WITH deleted AS (
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = ANY(object_ids) AND object_row.archived_at IS NOT NULL
              RETURNING object_row.id, object_row.is_delete_marker, object_row.metadata
        )
        SELECT array_agg(deleted.id), array_agg(deleted.is_delete_marker), array_agg(deleted.metadata)
          INTO deleted_ids, deleted_markers, deleted_metadata
          FROM deleted;
        bulk_deleted := true;
    EXCEPTION
        WHEN OTHERS THEN
            -- User triggers may use insufficient_privilege to block a row.
            IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                RAISE;
            END IF;
    END;
    IF bulk_deleted THEN
        RETURN QUERY SELECT * FROM unnest(deleted_ids, deleted_markers, deleted_metadata);
        RETURN;
    END IF;

    FOREACH object_id IN ARRAY object_ids LOOP
        BEGIN
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = object_id AND object_row.archived_at IS NOT NULL
              RETURNING object_row.* INTO deleted_row;
            IF FOUND THEN
                id := deleted_row.id;
                is_delete_marker := deleted_row.is_delete_marker;
                metadata := deleted_row.metadata;
                RETURN NEXT;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                    RAISE;
                END IF;
        END;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 460 (class 1255 OID 25485)
-- Name: enforce_bucket_lifecycle_service_role(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_lifecycle_service_role() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0] THEN
    -- Keep this check AFTER caller RLS accepts the proposed row. The API
    -- recognizes this exact signal after rolling back its permission probe.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION storage.enforce_bucket_lifecycle_service_role() OWNER TO supabase_storage_admin;

--
-- TOC entry 452 (class 1255 OID 17405)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- TOC entry 483 (class 1255 OID 27285)
-- Name: enforce_versioning_status_transition(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_versioning_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.versioning_status = OLD.versioning_status THEN
        RETURN NEW;
    END IF;

    IF NEW.versioning_status = 'DISABLED' OR
       (OLD.versioning_status = 'DISABLED' AND NEW.versioning_status = 'SUSPENDED') THEN
        RAISE EXCEPTION 'Cannot transition bucket versioning status from % to %',
            OLD.versioning_status, NEW.versioning_status;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.enforce_versioning_status_transition() OWNER TO supabase_storage_admin;

--
-- TOC entry 448 (class 1255 OID 17324)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 447 (class 1255 OID 17323)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 446 (class 1255 OID 17322)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 453 (class 1255 OID 17462)
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN p_delimiter <> ''
         AND position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(
        p_key,
        length(p_prefix)
            + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1))
            + length(p_delimiter) - 1
    )
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- TOC entry 466 (class 1255 OID 25497)
-- Name: get_size_by_bucket(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket(noncurrent_versions text DEFAULT 'include'::text, delete_markers text DEFAULT 'include'::text) RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'include');
    delete_markers := COALESCE(delete_markers, 'include');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'include';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'include';
    END IF;

    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        where (noncurrent_versions != 'exclude' OR obj.archived_at IS NULL)
          and (noncurrent_versions != 'only' OR obj.archived_at IS NOT NULL)
          and (delete_markers != 'exclude' OR NOT obj.is_delete_marker)
          and (delete_markers != 'only' OR obj.is_delete_marker)
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket(noncurrent_versions text, delete_markers text) OWNER TO supabase_storage_admin;

--
-- TOC entry 461 (class 1255 OID 25489)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text, raw_prefix_param text DEFAULT NULL::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $_$
WITH candidates AS (
    SELECT
        upload.key AS object_key,
        CASE
            WHEN position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0
            THEN left(
                upload.key,
                length(coalesce($7, $2))
                    + position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1))
                    + length($3) - 1
            )
            ELSE upload.key
        END AS result_key,
        upload.id,
        upload.created_at,
        position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0 AS is_common_prefix
    FROM storage.s3_multipart_uploads AS upload
    WHERE upload.bucket_id = $1
      AND upload.key COLLATE "C" LIKE $2 || '%'
), filtered AS (
    SELECT candidate.*
    FROM candidates AS candidate
    WHERE $5 = ''
       OR candidate.result_key COLLATE "C" > $5
       OR (
           candidate.result_key COLLATE "C" = $5
           AND NOT candidate.is_common_prefix
           AND $6 <> ''
           -- A completed or aborted marker repeats the remaining same-key uploads.
           AND COALESCE(
               (candidate.created_at, candidate.id COLLATE "C") > (
                   SELECT marker.created_at, marker.id COLLATE "C"
                   FROM storage.s3_multipart_uploads AS marker
                   WHERE marker.bucket_id = $1
                     AND marker.key COLLATE "C" = $5
                     AND marker.id = $6
               ),
               TRUE
           )
       )
), ranked AS (
    SELECT
        filtered.*,
        row_number() OVER (
            PARTITION BY filtered.result_key COLLATE "C"
            ORDER BY filtered.created_at, filtered.id COLLATE "C"
        ) AS prefix_rank
    FROM filtered
)
SELECT ranked.result_key, ranked.id, ranked.created_at
FROM ranked
WHERE NOT ranked.is_common_prefix OR ranked.prefix_rank = 1
ORDER BY ranked.result_key COLLATE "C", ranked.created_at, ranked.id COLLATE "C"
LIMIT $4;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text, raw_prefix_param text) OWNER TO supabase_storage_admin;

--
-- TOC entry 462 (class 1255 OID 25490)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text, text, text, timestamp with time zone, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, next_token_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, next_token_version text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_start_relative TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;

    -- true when noncurrent_versions can return >1 row per name; keeps them
    -- ordered most-recent-first and lets pagination resume mid-key
    v_multi_row BOOLEAN;
    v_name_order TEXT;
    v_exact_range_predicate TEXT;
    v_strict_range_predicate TEXT;
    v_inclusive_range_predicate TEXT;

    -- Seek state for the current name. archived_at is normalized to JavaScript's
    -- millisecond precision and version breaks ties within the same millisecond.
    -- Current rows use 'infinity'; NULL means no tiebreak has been established.
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_cursor_is_folder BOOLEAN;
    v_count INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_batch_query_strict TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');
    v_name_order := CASE WHEN v_is_asc THEN 'ASC' ELSE 'DESC' END;

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Keep caller-provided cursors inside the requested prefix range.
    IF v_start <> '' AND v_upper_bound IS NOT NULL THEN
        IF v_is_asc THEN
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                v_start := '';
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                RETURN;
            END IF;
        ELSE
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                RETURN;
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                v_start := '';
            END IF;
        END IF;
    END IF;

    v_start_relative := substring(v_start FROM length(v_prefix) + 1);

    -- Direction affects only the indexed name range and its ordering. Cursor
    -- state transitions and within-key version ordering stay shared.
    IF v_is_asc THEN
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" > $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" >= $2';
        IF v_upper_bound IS NOT NULL THEN
            v_exact_range_predicate := 'o.name COLLATE "C" < $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" < $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" < $3';
        END IF;
    ELSE
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" < $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" < $2';
        IF v_prefix <> '' THEN
            v_exact_range_predicate := 'o.name COLLATE "C" >= $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" >= $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" >= $3';
        END IF;
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    -- The multi-row order matches the externally serialized cursor exactly:
    -- archived_at at millisecond precision, then version as the final tiebreak.
    --
    -- When v_multi_row, the seek is a keyset tuple comparison ("name > $2 OR
    -- (name = $2 AND tiebreak)") - Postgres won't split that OR into indexable
    -- form (confirmed even with fully literal values), so as one WHERE clause
    -- it forces a full bucket scan filtered row-by-row. Splitting it into two
    -- independently-indexable branches (exact name match with the tiebreak
    -- filter, vs. strictly-past names) combined with UNION ALL lets each
    -- branch keep name as a real index condition; the outer ORDER BY/LIMIT
    -- re-merges them into the same page the single query used to produce.
    IF v_multi_row THEN
        v_batch_query := format(
            $sql$
            SELECT *
            FROM (
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND o.name COLLATE "C" = $2
                      AND %s
                      AND NOT $7::boolean
                      AND (
                          $5::timestamptz IS NULL
                          OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < $5
                          OR (
                              COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = $5
                              AND COALESCE(o.version, '') > $6
                          )
                      )
                      %s
                    ORDER BY
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
                UNION ALL
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND %s
                      %s
                    ORDER BY
                        o.name COLLATE "C" %s,
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
            ) sub
            ORDER BY
                sub.name COLLATE "C" %s,
                COALESCE(date_trunc('milliseconds', sub.archived_at), 'infinity'::timestamptz) DESC,
                COALESCE(sub.version, '') ASC
            LIMIT $4
            $sql$,
            v_exact_range_predicate,
            v_version_filter,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order,
            v_name_order
        );
    ELSE
        v_batch_query := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_inclusive_range_predicate,
            v_version_filter,
            v_name_order
        );

        -- Strict counterpart of the query above: used once the single-row
        -- ASC batch advance (below) has left v_next_seek pointing at the
        -- last row already emitted, so an inclusive predicate would
        -- re-match it forever. Only single-row mode ever sets strict mode,
        -- so this variant is never needed when v_multi_row.
        v_batch_query_strict := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order
        );
    END IF;

    -- The static peek predicates cannot use the partial delete-marker index
    -- once PL/pgSQL switches to a generic plan because whether
    -- is_delete_marker is required remains parameter-dependent. Reuse the
    -- already-specialized batch query with a one-row limit for this sparse
    -- filter so the plan sees a literal `o.is_delete_marker` predicate.
    IF delete_markers = 'only' THEN
        v_delete_marker_peek_query :=
            'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        IF NOT v_multi_row THEN
            v_delete_marker_peek_query_strict :=
                'SELECT marker_page.name FROM (' || v_batch_query_strict || ') marker_page LIMIT 1';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor performs one specialized initial seek so
            -- partial current-version and delete-marker indexes remain available.
            EXECUTE format(
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY o.name COLLATE "C" DESC LIMIT 1',
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND o.name COLLATE "C" >= $2 AND o.name COLLATE "C" < $3'
                    ELSE ''
                END,
                v_version_filter
            )
            INTO v_next_seek
            USING _bucket_id, v_prefix, v_upper_bound;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Folder continuation tokens retain their trailing delimiter. A
        -- delimiter-less startAfter is always a literal key boundary.
        v_cursor_is_folder := delimiter_param <> ''
            AND v_start_relative <> ''
            AND right(v_start_relative, length(delimiter_param)) = delimiter_param;

        IF v_cursor_is_folder THEN
            v_next_seek := CASE
                WHEN right(v_start, length(delimiter_param)) = delimiter_param
                    THEN v_start
                ELSE v_start || delimiter_param
            END;
            IF v_is_asc THEN
                v_next_seek := left(v_next_seek, -1)
                    || chr(ascii(right(v_next_seek, 1)) + 1);
            END IF;
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- leaf object: when v_multi_row, stay on v_start with the
            -- caller-supplied tiebreak so a page boundary mid-key resumes
            -- that key's remaining rows instead of skipping them. Truncate
            -- to milliseconds like every other v_next_seek_at assignment -
            -- harmless today since object.ts's cursor always round-trips
            -- through JS Date first, but this shouldn't rely on that.
            IF v_multi_row THEN
                v_next_seek := v_start;
                v_next_seek_at := date_trunc('milliseconds', next_token_archived_at);
                v_next_seek_version := coalesce(next_token_version, '');
                v_next_seek_strict := coalesce(next_token, '') = '';
            ELSIF v_is_asc THEN
                v_next_seek := v_start;
                v_next_seek_strict := true;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        -- v_multi_row is branched here (rather than folded into the WHERE
        -- clause as a bound parameter) so each concrete query keeps an
        -- unconditional seek predicate - once PL/pgSQL switches to its
        -- cached generic plan (after 5 calls), a parameter-gated
        -- "(NOT v_multi_row AND name >= $x) OR (v_multi_row AND ...)"
        -- predicate stops the planner from using name as an index
        -- condition at all, degrading every subsequent peek to a full
        -- index scan filtered row-by-row instead of a bounded range scan.
        -- v_multi_row's seek predicate is a keyset tuple comparison
        -- ("name > x OR (name = x AND tiebreak)") - Postgres does not
        -- split this OR into indexable form even with fully literal
        -- values, so it falls back to a full scan filtered row-by-row.
        -- Splitting it into two independently-indexable branches (exact
        -- name match with the tiebreak filter, vs. strictly-past name)
        -- combined with UNION ALL lets each branch keep name as a real
        -- index condition; the outer ORDER BY/LIMIT picks whichever of
        -- the (at most 2) rows sorts first.
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING _bucket_id, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END,
                    1, v_next_seek_at, v_next_seek_version, v_next_seek_strict;
        ELSIF v_multi_row THEN
            IF v_is_asc THEN
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" < v_upper_bound
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek AND o.name COLLATE "C" < v_upper_bound
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" >= v_prefix
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        ELSE
            -- Single-row mode is always noncurrent_versions='exclude'. Keep
            -- this predicate literal so generic plans use the current index.
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.name COLLATE "C" >= v_prefix
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := v_common_prefix;
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            version := NULL;
            archived_at := NULL;
            is_delete_marker := NULL;
            is_versioned := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1)
                    || chr(ascii(right(v_common_prefix, 1)) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row THEN v_batch_query_strict ELSE v_batch_query END
                USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size, v_next_seek_at, v_next_seek_version,
                v_next_seek_strict
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN v_current.name
                        ELSE v_current.name || delimiter_param
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                version := v_current.version;
                archived_at := v_current.archived_at;
                is_delete_marker := v_current.is_delete_marker;
                is_versioned := v_current.is_versioned;
                RETURN NEXT;
                v_count := v_count + 1;

                -- when v_multi_row, stay on this name and record its
                -- archived_at as the new tiebreak so remaining rows for the
                -- same key are picked up before moving to the next name
                IF v_multi_row THEN
                    v_next_seek := v_current.name;
                    v_next_seek_at := COALESCE(date_trunc('milliseconds', v_current.archived_at), 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                    v_next_seek_strict := false;
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor
                    -- would skip a real key like `name || '!'` (or any
                    -- character sorting below the delimiter), which sorts
                    -- between `name` and `name || delimiter`. Track the real
                    -- name and mark the next comparison strict instead.
                    v_next_seek := v_current.name;
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.list_objects_with_delimiter made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text, noncurrent_versions text, delete_markers text, next_token_archived_at timestamp with time zone, next_token_version text) OWNER TO supabase_storage_admin;

--
-- TOC entry 451 (class 1255 OID 17404)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- TOC entry 485 (class 1255 OID 27527)
-- Name: protect_active_lifecycle_states(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_active_lifecycle_states() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM storage.bucket_lifecycle_states
        WHERE bucket_id = OLD.id
          AND NOT (
              continuation IS NULL
              OR (continuation @> '{"continuationVersion": 1}' AND continuation #> '{batch,inFlight}' IS NULL)
          )
    ) THEN
        RAISE EXCEPTION 'update or delete on table "buckets" violates foreign key constraint "bucket_lifecycle_states_bucket_id_fkey" on table "bucket_lifecycle_states"'
            USING ERRCODE = 'foreign_key_violation',
                  DETAIL = format('Key (id)=(%s) is still referenced from table "bucket_lifecycle_states".', OLD.id),
                  SCHEMA = 'storage',
                  TABLE = 'bucket_lifecycle_states',
                  CONSTRAINT = 'bucket_lifecycle_states_bucket_id_fkey';
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.protect_active_lifecycle_states() OWNER TO supabase_storage_admin;

--
-- TOC entry 459 (class 1255 OID 25484)
-- Name: protect_bucket_control_columns(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_bucket_control_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION storage.protect_bucket_control_columns() OWNER TO supabase_storage_admin;

--
-- TOC entry 454 (class 1255 OID 17469)
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- TOC entry 486 (class 1255 OID 27529)
-- Name: reconcile_lifecycle_state(text, boolean); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
    bucket storage.buckets%ROWTYPE;
    active boolean;
    idle boolean;
    state_generation uuid;
BEGIN
    SELECT * INTO bucket FROM storage.buckets WHERE id = target_bucket_id FOR NO KEY UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT continuation IS NULL OR (
               continuation @> '{"continuationVersion": 1}'
               AND continuation #> '{batch,inFlight}' IS NULL
           ), generation
    INTO idle, state_generation
    FROM storage.bucket_lifecycle_states
    WHERE bucket_id = target_bucket_id
    FOR UPDATE;

    IF bucket.lifecycle_configuration IS NULL THEN
        DELETE FROM storage.bucket_lifecycle_states
        WHERE bucket_id = target_bucket_id
          AND idle IS TRUE;

        UPDATE storage.bucket_lifecycle_states
        SET next_run_at = clock_timestamp(), updated_at = clock_timestamp()
        WHERE bucket_id = target_bucket_id
          AND idle IS NOT TRUE;
        RETURN;
    END IF;

    active := bucket.versioning_status <> 'DISABLED'
        AND bucket.lifecycle_configuration @> '{"rules":[{"status":"Enabled"}]}'::jsonb;

    -- The state row records the generation it was reconciled with so callers need not detect
    -- policy changes. Rows without a recorded generation keep their work.
    policy_changed := policy_changed OR (
        state_generation IS NOT NULL AND state_generation <> bucket.lifecycle_configuration_generation
    );

    INSERT INTO storage.bucket_lifecycle_states AS state (bucket_id, generation, next_run_at)
    VALUES (bucket.id, bucket.lifecycle_configuration_generation, CASE WHEN active THEN clock_timestamp() END)
    ON CONFLICT (bucket_id) DO UPDATE
    SET next_run_at = CASE
            WHEN policy_changed THEN
                CASE WHEN active OR idle IS NOT TRUE THEN clock_timestamp() END
            ELSE EXCLUDED.next_run_at
        END,
        generation = EXCLUDED.generation,
        claim_id = CASE WHEN policy_changed AND idle IS TRUE
                        THEN NULL ELSE state.claim_id END,
        claim_until = CASE WHEN policy_changed AND idle IS TRUE
                           THEN NULL ELSE state.claim_until END,
        continuation = CASE WHEN policy_changed AND idle IS TRUE
                            THEN NULL ELSE state.continuation END,
        failure_count = CASE WHEN policy_changed AND idle IS TRUE
                             THEN 0 ELSE state.failure_count END,
        last_error = CASE WHEN policy_changed AND idle IS TRUE
                          THEN NULL ELSE state.last_error END,
        updated_at = clock_timestamp()
    WHERE policy_changed OR (state.next_run_at IS NULL AND EXCLUDED.next_run_at IS NOT NULL);
END;
$$;


ALTER FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) OWNER TO supabase_storage_admin;

--
-- TOC entry 463 (class 1255 OID 25492)
-- Name: search(text, text, integer, integer, integer, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;
    v_multi_row BOOLEAN;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_count INT := 0;
    v_skipped INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;
    v_previous_skipped INT;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                  AND ($7 != 'exclude' OR objects.archived_at IS NULL)
                  AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
                  AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
                  AND ($8 != 'only' OR objects.is_delete_marker)
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata,
                   NULL::text AS version,
                   NULL::timestamptz AS archived_at,
                   NULL::boolean AS is_delete_marker,
                   NULL::boolean AS is_versioned FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata,
                   version, archived_at, is_delete_marker, is_versioned
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
               AND ($7 != 'exclude' OR objects.archived_at IS NULL)
               AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
               AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
               AND ($8 != 'only' OR objects.is_delete_marker)
             -- name, then version, as tiebreaks so two versions of the same
             -- key tying on the sort column still sort deterministically
             ORDER BY %I %s, name COLLATE "C" %s, COALESCE(version, '') %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order, v_sort_order, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets, noncurrent_versions, delete_markers;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build a resume-safe batch query. The exact-name branch returns remaining
    -- versions after the current (archived_at, version) boundary; the strict
    -- name branch returns subsequent keys. UNION ALL keeps both predicates
    -- independently indexable.
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2 AND lower(o.name) COLLATE "C" < $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 AND lower(o.name) COLLATE "C" >= $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    END IF;

    -- Keep the delete-marker predicate literal so the cached generic
    -- plan can use idx_objects_delete_markers during the main-loop peek.
    IF delete_markers = 'only' THEN
        IF v_multi_row THEN
            v_delete_marker_peek_query :=
                'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        ELSIF v_is_asc THEN
            -- Two separate literal query strings, not one gated by a bound
            -- boolean: folding "$n AND op1 OR NOT $n AND op2" into a single
            -- query defeats the generic plan's ability to push either
            -- comparison into the index. Branching in PL/pgSQL control flow
            -- instead keeps each query's index condition intact.
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" >= $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
            -- Strict variant: used once the single-row ASC batch advance
            -- (below) has left v_next_seek pointing at the last row already
            -- emitted, so a plain >= would re-match it forever.
            v_delete_marker_peek_query_strict :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" > $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
        ELSE
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" < $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" >= $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC performs one specialized initial seek so partial current-version
        -- and delete-marker indexes remain available.
        EXECUTE format(
            'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1',
            CASE WHEN v_upper_bound IS NOT NULL
                THEN ' AND lower(o.name) COLLATE "C" >= $2 AND lower(o.name) COLLATE "C" < $3'
                ELSE ''
            END,
            v_version_filter
        )
        INTO v_peek_name
        USING bucketname, v_prefix_lower, v_upper_bound;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch and
    -- the delete-marker-only path
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;
        v_previous_skipped := v_skipped;

        -- STEP 1: PEEK
        v_peek_name := NULL;
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END,
                    1, v_next_seek_at, v_next_seek_version;
        ELSIF v_multi_row AND v_next_seek_at IS NOT NULL THEN
            SELECT o.name INTO v_peek_name
            FROM storage.objects o
            WHERE o.bucket_id = bucketname
              AND lower(o.name) COLLATE "C" = v_next_seek
              AND (COALESCE(o.archived_at, 'infinity'::timestamptz) < v_next_seek_at
                   OR (COALESCE(o.archived_at, 'infinity'::timestamptz) = v_next_seek_at
                       AND COALESCE(o.version, '') > v_next_seek_version))
              AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
              AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
              AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
              AND (delete_markers != 'only' OR o.is_delete_marker)
            ORDER BY COALESCE(o.archived_at, 'infinity'::timestamptz) DESC,
                     COALESCE(o.version, '') ASC
            LIMIT 1;

            -- The current key is exhausted. Clear its version boundary and
            -- make the following ASC name peek strict. Appending '/' is not a
            -- valid lexical successor because keys ending in characters such
            -- as '!' sort between the exhausted name and name || '/'.
            IF v_peek_name IS NULL THEN
                IF v_is_asc THEN
                    v_next_seek_strict := true;
                END IF;
                v_next_seek_at := NULL;
                v_next_seek_version := '';
            END IF;
        END IF;

        -- Single-row mode is always noncurrent_versions='exclude'. Keep the
        -- current-row predicate literal so generic plans use the current index.
        IF delete_markers != 'only' AND v_peek_name IS NULL AND NOT v_multi_row THEN
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL AND v_is_asc THEN
            IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_next_seek_strict THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- If the peek landed on a different key than we were tracking, any
        -- version boundary belongs to the OLD key and must not leak into the
        -- new one - e.g. the deleteMarkers='only' peek doesn't know or care
        -- whether it's continuing the same key or jumping to a new one, so
        -- it never clears these itself.
        IF lower(v_peek_name) IS DISTINCT FROM v_next_seek THEN
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        END IF;

        -- The peek is authoritative for the next key to process. This is
        -- especially important after exhausting a multi-version key: the
        -- version boundary has been cleared, so executing the batch against
        -- a stale v_next_seek would replay every version of that old key.
        v_next_seek := lower(v_peek_name);
        v_next_seek_strict := false;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                version := NULL;
                archived_at := NULL;
                is_delete_marker := NULL;
                is_versioned := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size,
                    v_next_seek_at, v_next_seek_version
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too - it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN lower(v_current.name)
                        ELSE lower(v_current.name) || v_delimiter
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    version := v_current.version;
                    archived_at := v_current.archived_at;
                    is_delete_marker := v_current.is_delete_marker;
                    is_versioned := v_current.is_versioned;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Multi-row mode must remain on this key until all of its
                -- versions have crossed the internal batch boundary.
                IF v_multi_row THEN
                    v_next_seek := lower(v_current.name);
                    v_next_seek_at := COALESCE(v_current.archived_at, 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor would
                    -- skip a real key like `name || '!'` (or any character
                    -- sorting below the delimiter), which sorts between `name`
                    -- and `name || delimiter`. Track the real name and mark the
                    -- next comparison strict instead - same fix as the
                    -- exhausted-key case above.
                    v_next_seek := lower(v_current.name);
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_skipped = v_previous_skipped
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.search made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text, noncurrent_versions text, delete_markers text) OWNER TO supabase_storage_admin;

--
-- TOC entry 464 (class 1255 OID 25494)
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, p_start_after_version text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_prefix_pattern text;
    v_sort_order text;
    v_sort_column text;
    v_version_tiebreak text;
BEGIN
    v_prefix := coalesce(p_prefix, '');
    -- Keep the raw prefix for common-prefix calculations and escape only LIKE metacharacters.
    v_prefix_pattern := replace(v_prefix, chr(92), chr(92) || chr(92));
    v_prefix_pattern := replace(v_prefix_pattern, '%', chr(92) || '%');
    v_prefix_pattern := replace(v_prefix_pattern, '_', chr(92) || '_');

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    -- $9 is only populated in multi-row mode; it's always '' otherwise, so
    -- only use each row's real version as a tiebreak in multi-row mode.
    v_version_tiebreak := CASE WHEN noncurrent_versions IN ('only', 'include') THEN 'COALESCE(version, '''')' ELSE '''''' END;

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                o.version AS obj_version,
                o.archived_at AS obj_archived_at,
                o.is_delete_marker AS obj_is_delete_marker,
                o.is_versioned AS obj_is_versioned,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $10 || '%%'
              AND ($7 != 'exclude' OR o.archived_at IS NULL)
              AND ($7 != 'only' OR o.archived_at IS NOT NULL)
              AND ($8 != 'exclude' OR NOT o.is_delete_marker)
              AND ($8 != 'only' OR o.is_delete_marker)
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                common_prefix AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                NULL::text AS version,
                NULL::timestamptz AS archived_at,
                NULL::boolean AS is_delete_marker,
                NULL::boolean AS is_versioned,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                obj_version AS version,
                obj_archived_at AS archived_at,
                obj_is_delete_marker AS is_delete_marker,
                obj_is_versioned AS is_versioned,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz),
                    name COLLATE "C",
                    %s
                ) %s ROW(
                    -- truncated the same way as the stored value above
                    date_trunc('milliseconds', COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz)),
                    $5,
                    $9
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata,
            version,
            archived_at,
            is_delete_marker,
            is_versioned
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s,
            COALESCE(version, '') %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_version_tiebreak,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order,
        v_sort_order
    );

    -- version is the third tiebreak component for two versions of the same
    -- key tying on both timestamp and name (see filtered CTE / ORDER BY above)
    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after, noncurrent_versions, delete_markers, coalesce(p_start_after_version, ''), v_prefix_pattern;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text, delete_markers text, p_start_after_version text) OWNER TO supabase_storage_admin;

--
-- TOC entry 465 (class 1255 OID 25496)
-- Name: search_v2(text, text, integer, integer, text, text, text, text, text, text, timestamp with time zone, text, boolean); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, start_after_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, start_after_version text DEFAULT ''::text, start_after_is_continuation boolean DEFAULT false) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata,
            l.version,
            l.archived_at,
            l.is_delete_marker,
            l.is_versioned
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            CASE WHEN start_after_is_continuation THEN '' ELSE start_after END,
            CASE WHEN start_after_is_continuation THEN start_after ELSE '' END,
            v_sort_ord,
            noncurrent_versions,
            delete_markers,
            start_after_archived_at,
            start_after_version
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after,
            noncurrent_versions, delete_markers, start_after_version
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text, noncurrent_versions text, delete_markers text, start_after_archived_at timestamp with time zone, start_after_version text, start_after_is_continuation boolean) OWNER TO supabase_storage_admin;

--
-- TOC entry 449 (class 1255 OID 17339)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- TOC entry 487 (class 1255 OID 27530)
-- Name: wake_lifecycle_state(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.wake_lifecycle_state() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.lifecycle_configuration IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM storage.reconcile_lifecycle_state(NEW.id, false);
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.wake_lifecycle_state() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 261 (class 1259 OID 16529)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 280 (class 1259 OID 17084)
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 274 (class 1259 OID 16889)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 274
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- TOC entry 265 (class 1259 OID 16687)
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 260 (class 1259 OID 16522)
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 269 (class 1259 OID 16776)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 268 (class 1259 OID 16764)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 267 (class 1259 OID 16751)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 301 (class 1259 OID 25551)
-- Name: mfa_recovery_code_sets; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_recovery_code_sets (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    mfa_factor_id uuid NOT NULL,
    failed_verification_count integer DEFAULT 0 NOT NULL,
    verification_locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mfa_recovery_code_sets_failed_verification_count_check CHECK ((failed_verification_count >= 0))
);


ALTER TABLE auth.mfa_recovery_code_sets OWNER TO supabase_auth_admin;

--
-- TOC entry 302 (class 1259 OID 25574)
-- Name: mfa_recovery_codes; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_recovery_codes (
    id uuid NOT NULL,
    mfa_recovery_code_set_id uuid NOT NULL,
    code_hash text NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE auth.mfa_recovery_codes OWNER TO supabase_auth_admin;

--
-- TOC entry 277 (class 1259 OID 17001)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- TOC entry 279 (class 1259 OID 17074)
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 279
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- TOC entry 276 (class 1259 OID 16971)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- TOC entry 278 (class 1259 OID 17034)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- TOC entry 275 (class 1259 OID 16939)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    link_token_hash text,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 259 (class 1259 OID 16511)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 258 (class 1259 OID 16510)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 258
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 272 (class 1259 OID 16818)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    dedicated_scope boolean,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 273 (class 1259 OID 16836)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 262 (class 1259 OID 16537)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 300 (class 1259 OID 25530)
-- Name: scim_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.scim_tokens (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    token_hash text NOT NULL,
    prefix text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    CONSTRAINT scim_tokens_expires_at_future CHECK (((expires_at IS NULL) OR (expires_at > created_at))),
    CONSTRAINT scim_tokens_revoked_after_created CHECK (((revoked_at IS NULL) OR (revoked_at >= created_at))),
    CONSTRAINT scim_tokens_token_hash_check CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);


ALTER TABLE auth.scim_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 299 (class 1259 OID 25499)
-- Name: scim_users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.scim_users (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    user_id uuid,
    resource jsonb NOT NULL,
    user_name text GENERATED ALWAYS AS (lower((resource ->> 'userName'::text))) STORED NOT NULL,
    external_id text GENERATED ALWAYS AS ((resource ->> 'externalId'::text)) STORED,
    active boolean GENERATED ALWAYS AS (COALESCE(((resource ->> 'active'::text))::boolean, true)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE auth.scim_users OWNER TO supabase_auth_admin;

--
-- TOC entry 266 (class 1259 OID 16717)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 271 (class 1259 OID 16803)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 271
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 270 (class 1259 OID 16794)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 270
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 257 (class 1259 OID 16499)
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 257
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 282 (class 1259 OID 17149)
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 281 (class 1259 OID 17126)
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- TOC entry 326 (class 1259 OID 26419)
-- Name: booking_receipt_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_receipt_details (
    document_id uuid NOT NULL,
    booking_id text,
    flat_no text,
    floor text,
    block_tower text,
    rate_per_sqft numeric(18,2),
    buyer_pan_aadhar text,
    project_unit_id uuid,
    booking_status text,
    prior_unit_status text,
    agreement_value numeric(18,2),
    balance_due numeric(18,2),
    payment_mode text,
    due_date date,
    CONSTRAINT chk_booking_receipt_details_booking_status CHECK (((booking_status IS NULL) OR (booking_status = ANY (ARRAY['Draft'::text, 'Confirmed'::text, 'Cancelled'::text, 'Completed'::text])))),
    CONSTRAINT chk_booking_receipt_details_payment_mode CHECK (((payment_mode IS NULL) OR (payment_mode = ANY (ARRAY['Cash'::text, 'Cheque'::text, 'UPI'::text, 'NEFT / RTGS'::text, 'Bank Transfer'::text])))),
    CONSTRAINT chk_booking_receipt_details_prior_unit_status CHECK (((prior_unit_status IS NULL) OR (prior_unit_status = ANY (ARRAY['available'::text, 'allocated'::text, 'booked'::text]))))
);


ALTER TABLE public.booking_receipt_details OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 26003)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    logo_url text,
    address text,
    phone text,
    email text,
    website text,
    gst_number text,
    pan_number text,
    primary_color text DEFAULT '#0B2857'::text,
    secondary_color text DEFAULT '#F4B72B'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gst_registration_type text,
    gst_state_code character varying(2)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 328 (class 1259 OID 26450)
-- Name: company_quotation_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_quotation_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    usage_year integer NOT NULL,
    usage_month integer NOT NULL,
    quotation_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT company_quotation_usage_quotation_count_check CHECK ((quotation_count >= 0)),
    CONSTRAINT company_quotation_usage_usage_month_check CHECK (((usage_month >= 1) AND (usage_month <= 12))),
    CONSTRAINT company_quotation_usage_usage_year_check CHECK ((usage_year >= 2000))
);


ALTER TABLE public.company_quotation_usage OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 26023)
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    company_id uuid NOT NULL,
    quotation_prefix text DEFAULT 'QTN'::text NOT NULL,
    booking_prefix text DEFAULT 'BR'::text NOT NULL,
    default_validity_days integer DEFAULT 30 NOT NULL,
    authorized_person text,
    designation text,
    signature_url text,
    bank_name text,
    account_name text,
    account_number text,
    ifsc text,
    branch text,
    upi_id text,
    default_terms text,
    default_tax_name text,
    default_tax_rate numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    invoice_prefix text DEFAULT 'INV'::text NOT NULL,
    enabled_business_models text[] DEFAULT ARRAY['contract_construction'::text, 'property_development'::text, 'civil_works_contract'::text, 'material_supply'::text] NOT NULL,
    CONSTRAINT company_settings_default_tax_rate_check CHECK (((default_tax_rate >= (0)::numeric) AND (default_tax_rate <= (100)::numeric))),
    CONSTRAINT company_settings_default_validity_days_check CHECK ((default_validity_days > 0))
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- TOC entry 327 (class 1259 OID 26431)
-- Name: company_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_subscriptions (
    company_id uuid NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    billing_cycle text,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT company_subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT company_subscriptions_plan_check CHECK ((plan = ANY (ARRAY['free'::text, 'paid'::text]))),
    CONSTRAINT company_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text])))
);


ALTER TABLE public.company_subscriptions OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 26043)
-- Name: company_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT company_users_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])))
);


ALTER TABLE public.company_users OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 26068)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    mobile text,
    email text,
    address text,
    city text,
    state text,
    pincode text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gstin text,
    gst_registration_type text,
    gst_state_code character varying(2),
    party_id uuid
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 323 (class 1259 OID 26374)
-- Name: document_exclusions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_exclusions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    description text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.document_exclusions OWNER TO postgres;

--
-- TOC entry 322 (class 1259 OID 26361)
-- Name: document_inclusions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_inclusions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    description text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.document_inclusions OWNER TO postgres;

--
-- TOC entry 320 (class 1259 OID 26320)
-- Name: document_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(18,4) DEFAULT 0 NOT NULL,
    unit_id uuid,
    unit text,
    rate numeric(18,2) DEFAULT 0 NOT NULL,
    amount numeric(18,2) DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    hsn_sac_code character varying(20),
    tax_treatment text DEFAULT 'taxable'::text NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0 NOT NULL,
    cgst_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    sgst_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    igst_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    cgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    sgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    igst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    row_type text DEFAULT 'item'::text NOT NULL,
    CONSTRAINT chk_document_items_tax_treatment CHECK ((tax_treatment = ANY (ARRAY['taxable'::text, 'zero_rated'::text, 'exempt'::text, 'nil_rated'::text, 'non_gst'::text]))),
    CONSTRAINT document_items_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT document_items_display_order_check CHECK ((display_order >= 0)),
    CONSTRAINT document_items_quantity_check CHECK ((quantity >= (0)::numeric)),
    CONSTRAINT document_items_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT document_items_row_type_check CHECK ((row_type = ANY (ARRAY['item'::text, 'note'::text])))
);


ALTER TABLE public.document_items OWNER TO postgres;

--
-- TOC entry 319 (class 1259 OID 26305)
-- Name: document_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    section_name text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT document_sections_display_order_check CHECK ((display_order >= 0))
);


ALTER TABLE public.document_sections OWNER TO postgres;

--
-- TOC entry 317 (class 1259 OID 26213)
-- Name: document_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    document_type text NOT NULL,
    financial_year integer NOT NULL,
    prefix text NOT NULL,
    next_number integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_sequences_document_type_check CHECK ((document_type = ANY (ARRAY['Quotation'::text, 'BookingReceipt'::text, 'Invoice'::text]))),
    CONSTRAINT document_sequences_next_number_check CHECK ((next_number > 0))
);


ALTER TABLE public.document_sequences OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 26346)
-- Name: document_specifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_specifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    specification_type text,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT document_specifications_display_order_check CHECK ((display_order >= 0))
);


ALTER TABLE public.document_specifications OWNER TO postgres;

--
-- TOC entry 325 (class 1259 OID 26404)
-- Name: document_terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    description text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT document_terms_display_order_check CHECK ((display_order >= 0))
);


ALTER TABLE public.document_terms OWNER TO postgres;

--
-- TOC entry 318 (class 1259 OID 26233)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid,
    document_type text NOT NULL,
    document_number text NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    quotation_date date,
    valid_until date,
    project_name text,
    project_location text,
    floors text,
    project_type_id uuid,
    project_type text,
    builtup_area numeric(18,2),
    area_unit_id uuid,
    area_unit text,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    additional_charges numeric(18,2) DEFAULT 0 NOT NULL,
    discount numeric(18,2) DEFAULT 0 NOT NULL,
    tax_rate_id uuid,
    tax_name text,
    tax_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0 NOT NULL,
    cgst_percentage numeric(5,2) DEFAULT 0,
    sgst_percentage numeric(5,2) DEFAULT 0,
    igst_percentage numeric(5,2) DEFAULT 0,
    cgst_amount numeric(18,2) DEFAULT 0,
    sgst_amount numeric(18,2) DEFAULT 0,
    igst_amount numeric(18,2) DEFAULT 0,
    tax_breakup jsonb,
    grand_total numeric(18,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    is_gst_applicable boolean DEFAULT false NOT NULL,
    tax_inclusive boolean DEFAULT false NOT NULL,
    supplier_gstin_snapshot text,
    supplier_state_code_snapshot character varying(2),
    customer_gstin_snapshot text,
    customer_state_code_snapshot character varying(2),
    place_of_supply_state_code character varying(2),
    supply_type text,
    reverse_charge boolean DEFAULT false NOT NULL,
    party_id uuid,
    project_id uuid,
    version integer DEFAULT 1 NOT NULL,
    discount_type text DEFAULT 'None'::text NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    additional_charge_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    questionnaire jsonb,
    internal_notes text,
    validity text,
    brand_snapshot jsonb,
    CONSTRAINT chk_documents_supply_type CHECK (((supply_type IS NULL) OR (supply_type = ANY (ARRAY['intra_state'::text, 'inter_state'::text])))),
    CONSTRAINT documents_additional_charges_check CHECK ((additional_charges >= (0)::numeric)),
    CONSTRAINT documents_cgst_amount_check CHECK ((cgst_amount >= (0)::numeric)),
    CONSTRAINT documents_cgst_percentage_check CHECK (((cgst_percentage >= (0)::numeric) AND (cgst_percentage <= (100)::numeric))),
    CONSTRAINT documents_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT documents_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT documents_discount_type_check CHECK ((discount_type = ANY (ARRAY['None'::text, 'Percentage'::text, 'Fixed Amount'::text]))),
    CONSTRAINT documents_document_type_check CHECK ((document_type = ANY (ARRAY['Quotation'::text, 'BookingReceipt'::text]))),
    CONSTRAINT documents_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT documents_igst_amount_check CHECK ((igst_amount >= (0)::numeric)),
    CONSTRAINT documents_igst_percentage_check CHECK (((igst_percentage >= (0)::numeric) AND (igst_percentage <= (100)::numeric))),
    CONSTRAINT documents_sgst_amount_check CHECK ((sgst_amount >= (0)::numeric)),
    CONSTRAINT documents_sgst_percentage_check CHECK (((sgst_percentage >= (0)::numeric) AND (sgst_percentage <= (100)::numeric))),
    CONSTRAINT documents_status_check CHECK ((status = ANY (ARRAY['Draft'::text, 'Generated'::text, 'Sent'::text, 'Accepted'::text, 'Rejected'::text, 'Expired'::text, 'Completed'::text, 'Cancelled'::text]))),
    CONSTRAINT documents_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT documents_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT documents_tax_percentage_check CHECK (((tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric))),
    CONSTRAINT documents_version_check CHECK ((version >= 1))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 312 (class 1259 OID 26110)
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- TOC entry 344 (class 1259 OID 27021)
-- Name: investors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.investors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.investors OWNER TO postgres;

--
-- TOC entry 342 (class 1259 OID 26974)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(18,4) DEFAULT 1 NOT NULL,
    unit text,
    rate numeric(18,2) DEFAULT 0 NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    hsn_sac_code character varying(20),
    tax_treatment text DEFAULT 'taxable'::text NOT NULL,
    cgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    sgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    igst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    cgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    sgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    igst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_invoice_items_tax_treatment CHECK ((tax_treatment = ANY (ARRAY['taxable'::text, 'zero_rated'::text, 'exempt'::text, 'nil_rated'::text, 'non_gst'::text]))),
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_items_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT invoice_items_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT invoice_items_tax_percentage_check CHECK (((tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric))),
    CONSTRAINT invoice_items_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 341 (class 1259 OID 26935)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid,
    customer_id uuid NOT NULL,
    invoice_number text NOT NULL,
    invoice_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    status text DEFAULT 'Draft'::text NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0 NOT NULL,
    grand_total numeric(18,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_gst_invoice boolean DEFAULT false NOT NULL,
    tax_inclusive boolean DEFAULT false NOT NULL,
    supplier_gstin_snapshot text,
    supplier_state_code_snapshot character varying(2),
    customer_gstin_snapshot text,
    customer_state_code_snapshot character varying(2),
    place_of_supply_state_code character varying(2),
    supply_type text,
    reverse_charge boolean DEFAULT false NOT NULL,
    cgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    sgst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    igst_amount numeric(18,2) DEFAULT 0 NOT NULL,
    tax_breakup jsonb,
    cgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    sgst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    igst_rate numeric(5,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_invoices_supply_type CHECK (((supply_type IS NULL) OR (supply_type = ANY (ARRAY['intra_state'::text, 'inter_state'::text])))),
    CONSTRAINT invoices_check CHECK (((due_date IS NULL) OR (due_date >= invoice_date))),
    CONSTRAINT invoices_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT invoices_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))),
    CONSTRAINT invoices_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['Draft'::text, 'Issued'::text, 'Cancelled'::text]))),
    CONSTRAINT invoices_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT invoices_tax_amount_check CHECK ((tax_amount >= (0)::numeric))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 349 (class 1259 OID 27244)
-- Name: material_receipt_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_receipt_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    material_receipt_id uuid NOT NULL,
    purchase_order_line_id uuid NOT NULL,
    ordered_quantity numeric(18,4) DEFAULT 0 NOT NULL,
    previously_received_quantity numeric(18,4) DEFAULT 0 NOT NULL,
    quantity_received numeric(18,4) DEFAULT 0 NOT NULL,
    accepted_quantity numeric(18,4) DEFAULT 0 NOT NULL,
    rejected_quantity numeric(18,4) DEFAULT 0 NOT NULL,
    remaining_quantity numeric(18,4) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    purchase_order_id uuid NOT NULL,
    CONSTRAINT material_receipt_lines_accepted_quantity_check CHECK ((accepted_quantity >= (0)::numeric)),
    CONSTRAINT material_receipt_lines_ordered_quantity_check CHECK ((ordered_quantity >= (0)::numeric)),
    CONSTRAINT material_receipt_lines_previously_received_quantity_check CHECK ((previously_received_quantity >= (0)::numeric)),
    CONSTRAINT material_receipt_lines_quantity_received_check CHECK ((quantity_received >= (0)::numeric)),
    CONSTRAINT material_receipt_lines_rejected_quantity_check CHECK ((rejected_quantity >= (0)::numeric)),
    CONSTRAINT material_receipt_lines_remaining_quantity_check CHECK ((remaining_quantity >= (0)::numeric))
);


ALTER TABLE public.material_receipt_lines OWNER TO postgres;

--
-- TOC entry 348 (class 1259 OID 27209)
-- Name: material_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid NOT NULL,
    purchase_order_id uuid NOT NULL,
    supplier_party_id uuid NOT NULL,
    receipt_number text NOT NULL,
    receipt_date date DEFAULT CURRENT_DATE NOT NULL,
    delivery_reference_number text,
    notes text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT material_receipts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'accepted'::text, 'rejected'::text])))
);


ALTER TABLE public.material_receipts OWNER TO postgres;

--
-- TOC entry 345 (class 1259 OID 27097)
-- Name: parties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    entity_type text DEFAULT 'person'::text NOT NULL,
    contact_person_name text,
    is_customer boolean DEFAULT false NOT NULL,
    is_supplier boolean DEFAULT false NOT NULL,
    is_investor boolean DEFAULT false NOT NULL,
    email text,
    mobile text,
    address text,
    city text,
    state text,
    pincode text,
    gstin text,
    gst_registration_type text,
    gst_state_code text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT parties_entity_type_check CHECK ((entity_type = ANY (ARRAY['person'::text, 'business'::text]))),
    CONSTRAINT parties_has_role CHECK (true)
);


ALTER TABLE public.parties OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 25987)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- TOC entry 343 (class 1259 OID 26998)
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    receipt_id uuid NOT NULL,
    allocated_amount numeric(18,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_allocations_allocated_amount_check CHECK ((allocated_amount > (0)::numeric))
);


ALTER TABLE public.payment_allocations OWNER TO postgres;

--
-- TOC entry 314 (class 1259 OID 26148)
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- TOC entry 324 (class 1259 OID 26387)
-- Name: payment_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    stage_name text NOT NULL,
    percentage numeric(5,2),
    amount numeric(18,2),
    due_date date,
    status text,
    display_order integer DEFAULT 0 NOT NULL,
    notes text,
    CONSTRAINT payment_schedules_amount_check CHECK (((amount IS NULL) OR (amount >= (0)::numeric))),
    CONSTRAINT payment_schedules_display_order_check CHECK ((display_order >= 0)),
    CONSTRAINT payment_schedules_percentage_check CHECK (((percentage IS NULL) OR ((percentage >= (0)::numeric) AND (percentage <= (100)::numeric))))
);


ALTER TABLE public.payment_schedules OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 17479)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 337 (class 1259 OID 26715)
-- Name: project_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    progress_update_id uuid,
    expense_id uuid,
    storage_path text NOT NULL,
    original_filename text NOT NULL,
    mime_type text,
    file_size_bytes bigint,
    visibility_status text DEFAULT 'internal'::text NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT ck_attachment_single_parent CHECK ((NOT ((expense_id IS NOT NULL) AND (progress_update_id IS NOT NULL)))),
    CONSTRAINT project_attachments_file_size_bytes_check CHECK (((file_size_bytes IS NULL) OR (file_size_bytes >= 0))),
    CONSTRAINT project_attachments_visibility_status_check CHECK ((visibility_status = ANY (ARRAY['internal'::text, 'published'::text])))
);


ALTER TABLE public.project_attachments OWNER TO postgres;

--
-- TOC entry 336 (class 1259 OID 26685)
-- Name: project_client_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_client_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    email text NOT NULL,
    user_id uuid,
    invitation_token_hash text,
    invitation_expires_at timestamp with time zone,
    invitation_status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_client_access_invitation_status_check CHECK ((invitation_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'expired'::text])))
);


ALTER TABLE public.project_client_access OWNER TO postgres;

--
-- TOC entry 334 (class 1259 OID 26626)
-- Name: project_expense_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_expense_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_expense_id uuid NOT NULL,
    amount numeric(18,2) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method_id uuid,
    payment_method text NOT NULL,
    reference_number text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    voided_at timestamp with time zone,
    company_id uuid NOT NULL,
    CONSTRAINT project_expense_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT project_expense_payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'upi'::text, 'bank_transfer'::text, 'cheque'::text, 'other'::text])))
);


ALTER TABLE public.project_expense_payments OWNER TO postgres;

--
-- TOC entry 333 (class 1259 OID 26596)
-- Name: project_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    category_id uuid,
    category text NOT NULL,
    description text NOT NULL,
    supplier_name text,
    supplier_bill_number text,
    bill_date date,
    due_date date,
    bill_amount numeric(18,2) NOT NULL,
    status text DEFAULT 'unpaid'::text NOT NULL,
    visibility_status text DEFAULT 'internal'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    voided_at timestamp with time zone,
    company_id uuid NOT NULL,
    supplier_id uuid,
    party_id uuid,
    expense_type text DEFAULT 'direct'::text NOT NULL,
    CONSTRAINT project_expenses_bill_amount_check CHECK ((bill_amount >= (0)::numeric)),
    CONSTRAINT project_expenses_expense_type_check CHECK ((expense_type = ANY (ARRAY['direct'::text, 'supplier_bill'::text]))),
    CONSTRAINT project_expenses_status_check CHECK ((status = ANY (ARRAY['unpaid'::text, 'partially_paid'::text, 'paid'::text, 'void'::text]))),
    CONSTRAINT project_expenses_visibility_status_check CHECK ((visibility_status = ANY (ARRAY['internal'::text, 'published'::text])))
);


ALTER TABLE public.project_expenses OWNER TO postgres;

--
-- TOC entry 339 (class 1259 OID 26783)
-- Name: project_investor_contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_investor_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_investor_id uuid NOT NULL,
    project_id uuid NOT NULL,
    company_id uuid NOT NULL,
    amount numeric(18,2) NOT NULL,
    contribution_date date DEFAULT CURRENT_DATE NOT NULL,
    reference_number text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_investor_contributions_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.project_investor_contributions OWNER TO postgres;

--
-- TOC entry 338 (class 1259 OID 26747)
-- Name: project_investors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_investors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    investment_percentage numeric(5,2),
    can_view_financials boolean DEFAULT false NOT NULL,
    can_approve_payments boolean DEFAULT false NOT NULL,
    can_view_client_receipts boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    investor_id uuid NOT NULL,
    party_id uuid,
    CONSTRAINT project_investors_investment_percentage_check CHECK (((investment_percentage >= (0)::numeric) AND (investment_percentage <= (100)::numeric)))
);


ALTER TABLE public.project_investors OWNER TO postgres;

--
-- TOC entry 332 (class 1259 OID 26562)
-- Name: project_progress_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_progress_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    stage_id uuid,
    title text NOT NULL,
    description text,
    progress_percentage numeric(5,2),
    update_date date DEFAULT CURRENT_DATE NOT NULL,
    visibility_status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid,
    published_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_progress_updates_progress_percentage_check CHECK (((progress_percentage IS NULL) OR ((progress_percentage >= (0)::numeric) AND (progress_percentage <= (100)::numeric)))),
    CONSTRAINT project_progress_updates_visibility_status_check CHECK ((visibility_status = ANY (ARRAY['draft'::text, 'published'::text])))
);


ALTER TABLE public.project_progress_updates OWNER TO postgres;

--
-- TOC entry 335 (class 1259 OID 26653)
-- Name: project_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    receipt_number text NOT NULL,
    amount numeric(18,2) NOT NULL,
    received_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method_id uuid,
    payment_method text NOT NULL,
    reference_number text,
    notes text,
    visibility_status text DEFAULT 'internal'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    voided_at timestamp with time zone,
    company_id uuid NOT NULL,
    customer_id uuid,
    CONSTRAINT project_receipts_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT project_receipts_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'upi'::text, 'bank_transfer'::text, 'cheque'::text, 'other'::text]))),
    CONSTRAINT project_receipts_visibility_status_check CHECK ((visibility_status = ANY (ARRAY['internal'::text, 'published'::text])))
);


ALTER TABLE public.project_receipts OWNER TO postgres;

--
-- TOC entry 316 (class 1259 OID 26187)
-- Name: project_stage_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_stage_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    project_type_id uuid,
    template_code text NOT NULL,
    name text NOT NULL,
    sequence_number integer NOT NULL,
    default_completion_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_model text NOT NULL,
    CONSTRAINT project_stage_templates_business_model_chk CHECK ((business_model = ANY (ARRAY['contract_construction'::text, 'property_development'::text, 'civil_works_contract'::text, 'material_supply'::text]))),
    CONSTRAINT project_stage_templates_default_completion_percentage_check CHECK (((default_completion_percentage >= (0)::numeric) AND (default_completion_percentage <= (100)::numeric))),
    CONSTRAINT project_stage_templates_sequence_number_check CHECK ((sequence_number > 0))
);


ALTER TABLE public.project_stage_templates OWNER TO postgres;

--
-- TOC entry 331 (class 1259 OID 26534)
-- Name: project_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    sequence_number integer DEFAULT 1 NOT NULL,
    planned_start_date date,
    planned_end_date date,
    actual_start_date date,
    actual_end_date date,
    completion_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_stages_completion_percentage_check CHECK (((completion_percentage >= (0)::numeric) AND (completion_percentage <= (100)::numeric))),
    CONSTRAINT project_stages_sequence_number_check CHECK ((sequence_number > 0)),
    CONSTRAINT project_stages_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text, 'skipped'::text])))
);


ALTER TABLE public.project_stages OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 26091)
-- Name: project_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_types OWNER TO postgres;

--
-- TOC entry 352 (class 1259 OID 27565)
-- Name: project_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid NOT NULL,
    flat_no text NOT NULL,
    floor integer,
    block_tower text,
    share_type text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_units_check CHECK (((status = ANY (ARRAY['available'::text, 'allocated'::text, 'booked'::text])) AND (((share_type = 'builder'::text) AND (status = ANY (ARRAY['available'::text, 'allocated'::text, 'booked'::text]))) OR ((share_type = 'landowner'::text) AND (status = ANY (ARRAY['allocated'::text, 'booked'::text])))))),
    CONSTRAINT project_units_share_type_check CHECK ((share_type = ANY (ARRAY['builder'::text, 'landowner'::text])))
);


ALTER TABLE public.project_units OWNER TO postgres;

--
-- TOC entry 330 (class 1259 OID 26490)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid,
    source_document_id uuid,
    project_type_id uuid,
    project_type_snapshot text,
    project_number text NOT NULL,
    name text NOT NULL,
    description text,
    site_address text,
    contract_amount numeric(18,2) DEFAULT 0 NOT NULL,
    start_date date,
    expected_end_date date,
    actual_end_date date,
    status text DEFAULT 'planned'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    budget_amount numeric(18,2),
    business_model text,
    projected_sales_value numeric(18,2),
    land_cost numeric(18,2),
    development_arrangement text,
    total_project_flats integer,
    landowner_party_id uuid,
    jda_agreement_reference text,
    jda_agreement_document_url text,
    jda_agreement_date date,
    builder_share_units integer,
    landowner_share_units integer,
    CONSTRAINT projects_budget_amount_check CHECK (((budget_amount IS NULL) OR (budget_amount >= (0)::numeric))),
    CONSTRAINT projects_builder_share_units_non_negative_chk CHECK (((builder_share_units IS NULL) OR (builder_share_units >= 0))),
    CONSTRAINT projects_business_model_check CHECK (((business_model IS NULL) OR (business_model = ANY (ARRAY['contract_construction'::text, 'property_development'::text, 'civil_works_contract'::text, 'material_supply'::text])))),
    CONSTRAINT projects_contract_amount_check CHECK ((contract_amount >= (0)::numeric)),
    CONSTRAINT projects_development_arrangement_chk CHECK (((development_arrangement IS NULL) OR (development_arrangement = ANY (ARRAY['self'::text, 'joint_development'::text])))),
    CONSTRAINT projects_land_cost_check CHECK (((land_cost IS NULL) OR (land_cost >= (0)::numeric))),
    CONSTRAINT projects_landowner_share_units_non_negative_chk CHECK (((landowner_share_units IS NULL) OR (landowner_share_units >= 0))),
    CONSTRAINT projects_projected_sales_value_check CHECK (((projected_sales_value IS NULL) OR (projected_sales_value >= (0)::numeric))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT projects_total_project_flats_positive_chk CHECK (((total_project_flats IS NULL) OR (total_project_flats > 0)))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 347 (class 1259 OID 27183)
-- Name: purchase_order_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(18,4) DEFAULT 0 NOT NULL,
    unit text,
    rate numeric(18,2) DEFAULT 0 NOT NULL,
    line_amount numeric(18,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchase_order_lines_line_amount_check CHECK ((line_amount >= (0)::numeric)),
    CONSTRAINT purchase_order_lines_quantity_check CHECK ((quantity >= (0)::numeric)),
    CONSTRAINT purchase_order_lines_rate_check CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.purchase_order_lines OWNER TO postgres;

--
-- TOC entry 346 (class 1259 OID 27147)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid NOT NULL,
    supplier_party_id uuid NOT NULL,
    po_number text NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery_date date,
    status text DEFAULT 'draft'::text NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchase_orders_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'cancelled'::text, 'closed'::text]))),
    CONSTRAINT purchase_orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT purchase_orders_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT purchase_orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 25971)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    user_agent text,
    ip_address text
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 329 (class 1259 OID 26469)
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    billing_cycle text NOT NULL,
    amount_paise integer NOT NULL,
    razorpay_order_id text NOT NULL,
    razorpay_payment_id text,
    status text DEFAULT 'created'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_payments_amount_paise_check CHECK ((amount_paise >= 0)),
    CONSTRAINT subscription_payments_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['created'::text, 'paid'::text, 'failed'::text])))
);


ALTER TABLE public.subscription_payments OWNER TO postgres;

--
-- TOC entry 340 (class 1259 OID 26875)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    mobile text,
    gstin text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    gst_registration_type text,
    gst_state_code character varying(2)
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 26167)
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    rate_percentage numeric(5,2) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tax_rates_check CHECK (((effective_to IS NULL) OR (effective_to >= effective_from))),
    CONSTRAINT tax_rates_rate_percentage_check CHECK (((rate_percentage >= (0)::numeric) AND (rate_percentage <= (100)::numeric)))
);


ALTER TABLE public.tax_rates OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 26129)
-- Name: units_of_measure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units_of_measure (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    symbol text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.units_of_measure OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 25954)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    phone text,
    company_name text,
    avatar_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 25937)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['user'::text, 'owner'::text, 'admin'::text, 'staff'::text, 'client'::text, 'investor'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 17243)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- TOC entry 287 (class 1259 OID 17250)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- TOC entry 288 (class 1259 OID 17253)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin;

--
-- TOC entry 289 (class 1259 OID 17263)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 350 (class 1259 OID 27506)
-- Name: bucket_lifecycle_states; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.bucket_lifecycle_states (
    bucket_id text NOT NULL,
    generation uuid,
    next_run_at timestamp with time zone,
    claim_id uuid,
    claim_until timestamp with time zone,
    continuation jsonb,
    last_started_at timestamp with time zone,
    last_completed_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_result jsonb,
    failure_count integer DEFAULT 0 NOT NULL,
    last_error jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bucket_lifecycle_continuation_object_check CHECK (((continuation IS NULL) OR (jsonb_typeof(continuation) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_failure_count_check CHECK ((failure_count >= 0)),
    CONSTRAINT bucket_lifecycle_last_result_object_check CHECK (((last_result IS NULL) OR (jsonb_typeof(last_result) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_recovery_due_check CHECK (((next_run_at IS NOT NULL) OR (NOT jsonb_path_exists(COALESCE(continuation, '{}'::jsonb), '$."batch"."inFlight"'::jsonpath))))
);


ALTER TABLE storage.bucket_lifecycle_states OWNER TO supabase_storage_admin;

--
-- TOC entry 291 (class 1259 OID 17294)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    lifecycle_configuration jsonb,
    lifecycle_configuration_generation uuid,
    CONSTRAINT buckets_lifecycle_configuration_pair_check CHECK (((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL))),
    CONSTRAINT buckets_lifecycle_configuration_shape_check CHECK (((lifecycle_configuration IS NULL) OR ((jsonb_typeof(lifecycle_configuration) = 'object'::text) AND (lifecycle_configuration ? 'rules'::text) AND
CASE
    WHEN (jsonb_typeof((lifecycle_configuration -> 'rules'::text)) = 'array'::text) THEN ((jsonb_array_length((lifecycle_configuration -> 'rules'::text)) >= 1) AND (jsonb_array_length((lifecycle_configuration -> 'rules'::text)) <= 1000))
    ELSE false
END))),
    CONSTRAINT buckets_lifecycle_configuration_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR ((lifecycle_configuration IS NULL) AND (lifecycle_configuration_generation IS NULL)))),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- TOC entry 5536 (class 0 OID 0)
-- Dependencies: 291
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 295 (class 1259 OID 17414)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- TOC entry 296 (class 1259 OID 17427)
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- TOC entry 351 (class 1259 OID 27534)
-- Name: lifecycle_abandoned_artifacts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.lifecycle_abandoned_artifacts (
    bucket_id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    version text,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.lifecycle_abandoned_artifacts OWNER TO supabase_storage_admin;

--
-- TOC entry 290 (class 1259 OID 17286)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- TOC entry 292 (class 1259 OID 17304)
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- TOC entry 5541 (class 0 OID 0)
-- Dependencies: 292
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 293 (class 1259 OID 17353)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- TOC entry 294 (class 1259 OID 17367)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- TOC entry 297 (class 1259 OID 17437)
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- TOC entry 3884 (class 2604 OID 16514)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4477 (class 2606 OID 16789)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 4446 (class 2606 OID 16535)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4533 (class 2606 OID 17121)
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- TOC entry 4535 (class 2606 OID 17119)
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4500 (class 2606 OID 16895)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 4455 (class 2606 OID 16913)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 4457 (class 2606 OID 16923)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 4444 (class 2606 OID 16528)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4479 (class 2606 OID 16782)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 4475 (class 2606 OID 16770)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4467 (class 2606 OID 16963)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 4469 (class 2606 OID 16757)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 4605 (class 2606 OID 25563)
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_key UNIQUE (mfa_factor_id);


--
-- TOC entry 4607 (class 2606 OID 25559)
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_pkey PRIMARY KEY (id);


--
-- TOC entry 4609 (class 2606 OID 25561)
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_key UNIQUE (user_id);


--
-- TOC entry 4611 (class 2606 OID 25581)
-- Name: mfa_recovery_codes mfa_recovery_codes_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4514 (class 2606 OID 17022)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4516 (class 2606 OID 17020)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4518 (class 2606 OID 17018)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4528 (class 2606 OID 17080)
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4511 (class 2606 OID 16982)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4522 (class 2606 OID 17044)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4524 (class 2606 OID 17046)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 4505 (class 2606 OID 16948)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4438 (class 2606 OID 16518)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4441 (class 2606 OID 16700)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 4489 (class 2606 OID 16829)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 4491 (class 2606 OID 16827)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4496 (class 2606 OID 16843)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4449 (class 2606 OID 16541)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4600 (class 2606 OID 25540)
-- Name: scim_tokens scim_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4592 (class 2606 OID 25510)
-- Name: scim_users scim_users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4462 (class 2606 OID 16721)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4486 (class 2606 OID 16810)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 4481 (class 2606 OID 16801)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4431 (class 2606 OID 16883)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 4433 (class 2606 OID 16505)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4543 (class 2606 OID 17158)
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4539 (class 2606 OID 17141)
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 4711 (class 2606 OID 26425)
-- Name: booking_receipt_details booking_receipt_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_receipt_details
    ADD CONSTRAINT booking_receipt_details_pkey PRIMARY KEY (document_id);


--
-- TOC entry 4632 (class 2606 OID 26017)
-- Name: companies companies_id_owner_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_id_owner_id_key UNIQUE (id, owner_id);


--
-- TOC entry 4634 (class 2606 OID 26015)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 4717 (class 2606 OID 26463)
-- Name: company_quotation_usage company_quotation_usage_company_id_usage_year_usage_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_quotation_usage
    ADD CONSTRAINT company_quotation_usage_company_id_usage_year_usage_month_key UNIQUE (company_id, usage_year, usage_month);


--
-- TOC entry 4719 (class 2606 OID 26461)
-- Name: company_quotation_usage company_quotation_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_quotation_usage
    ADD CONSTRAINT company_quotation_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4636 (class 2606 OID 26037)
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4715 (class 2606 OID 26444)
-- Name: company_subscriptions company_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4638 (class 2606 OID 26057)
-- Name: company_users company_users_company_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_user_id_key UNIQUE (company_id, user_id);


--
-- TOC entry 4640 (class 2606 OID 26055)
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4643 (class 2606 OID 26080)
-- Name: customers customers_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4645 (class 2606 OID 26078)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4702 (class 2606 OID 26381)
-- Name: document_exclusions document_exclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_exclusions
    ADD CONSTRAINT document_exclusions_pkey PRIMARY KEY (id);


--
-- TOC entry 4699 (class 2606 OID 26368)
-- Name: document_inclusions document_inclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_inclusions
    ADD CONSTRAINT document_inclusions_pkey PRIMARY KEY (id);


--
-- TOC entry 4693 (class 2606 OID 26335)
-- Name: document_items document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4690 (class 2606 OID 26314)
-- Name: document_sections document_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sections
    ADD CONSTRAINT document_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4675 (class 2606 OID 26227)
-- Name: document_sequences document_sequences_company_id_document_type_financial_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_company_id_document_type_financial_year_key UNIQUE (company_id, document_type, financial_year);


--
-- TOC entry 4677 (class 2606 OID 26225)
-- Name: document_sequences document_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_pkey PRIMARY KEY (id);


--
-- TOC entry 4696 (class 2606 OID 26355)
-- Name: document_specifications document_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_specifications
    ADD CONSTRAINT document_specifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4708 (class 2606 OID 26413)
-- Name: document_terms document_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_terms
    ADD CONSTRAINT document_terms_pkey PRIMARY KEY (id);


--
-- TOC entry 4679 (class 2606 OID 26272)
-- Name: documents documents_company_id_document_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_document_number_key UNIQUE (company_id, document_number);


--
-- TOC entry 4681 (class 2606 OID 26274)
-- Name: documents documents_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4683 (class 2606 OID 26270)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4654 (class 2606 OID 26121)
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4817 (class 2606 OID 27031)
-- Name: investors investors_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investors
    ADD CONSTRAINT investors_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4819 (class 2606 OID 27029)
-- Name: investors investors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investors
    ADD CONSTRAINT investors_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 26992)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 26958)
-- Name: invoices invoices_company_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_invoice_number_key UNIQUE (company_id, invoice_number);


--
-- TOC entry 4805 (class 2606 OID 26956)
-- Name: invoices invoices_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4807 (class 2606 OID 26954)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 27265)
-- Name: material_receipt_lines material_receipt_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipt_lines
    ADD CONSTRAINT material_receipt_lines_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 27223)
-- Name: material_receipts material_receipts_company_id_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_company_id_receipt_number_key UNIQUE (company_id, receipt_number);


--
-- TOC entry 4845 (class 2606 OID 27221)
-- Name: material_receipts material_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 27114)
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- TOC entry 4628 (class 2606 OID 25995)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 4630 (class 2606 OID 25997)
-- Name: password_resets password_resets_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4814 (class 2606 OID 27005)
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 4662 (class 2606 OID 26159)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 4706 (class 2606 OID 26398)
-- Name: payment_schedules payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 4586 (class 2606 OID 17487)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4779 (class 2606 OID 26726)
-- Name: project_attachments project_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT project_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4772 (class 2606 OID 26697)
-- Name: project_client_access project_client_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_client_access
    ADD CONSTRAINT project_client_access_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 26699)
-- Name: project_client_access project_client_access_project_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_client_access
    ADD CONSTRAINT project_client_access_project_id_email_key UNIQUE (project_id, email);


--
-- TOC entry 4759 (class 2606 OID 26637)
-- Name: project_expense_payments project_expense_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT project_expense_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4753 (class 2606 OID 26610)
-- Name: project_expenses project_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT project_expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 4793 (class 2606 OID 26793)
-- Name: project_investor_contributions project_investor_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investor_contributions
    ADD CONSTRAINT project_investor_contributions_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 26767)
-- Name: project_investors project_investors_id_project_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_id_project_id_company_id_key UNIQUE (id, project_id, company_id);


--
-- TOC entry 4786 (class 2606 OID 26761)
-- Name: project_investors project_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 26765)
-- Name: project_investors project_investors_project_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_project_id_email_key UNIQUE (project_id, email);


--
-- TOC entry 4790 (class 2606 OID 26763)
-- Name: project_investors project_investors_project_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_project_id_user_id_key UNIQUE (project_id, user_id);


--
-- TOC entry 4745 (class 2606 OID 26575)
-- Name: project_progress_updates project_progress_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT project_progress_updates_pkey PRIMARY KEY (id);


--
-- TOC entry 4764 (class 2606 OID 26667)
-- Name: project_receipts project_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT project_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 4766 (class 2606 OID 26669)
-- Name: project_receipts project_receipts_project_id_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT project_receipts_project_id_receipt_number_key UNIQUE (project_id, receipt_number);


--
-- TOC entry 4671 (class 2606 OID 26200)
-- Name: project_stage_templates project_stage_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stage_templates
    ADD CONSTRAINT project_stage_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4738 (class 2606 OID 26549)
-- Name: project_stages project_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stages
    ADD CONSTRAINT project_stages_pkey PRIMARY KEY (id);


--
-- TOC entry 4740 (class 2606 OID 26551)
-- Name: project_stages project_stages_project_id_sequence_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stages
    ADD CONSTRAINT project_stages_project_id_sequence_number_key UNIQUE (project_id, sequence_number);


--
-- TOC entry 4650 (class 2606 OID 26102)
-- Name: project_types project_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT project_types_pkey PRIMARY KEY (id);


--
-- TOC entry 4861 (class 2606 OID 27577)
-- Name: project_units project_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_pkey PRIMARY KEY (id);


--
-- TOC entry 4730 (class 2606 OID 26505)
-- Name: projects projects_company_id_project_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_company_id_project_number_key UNIQUE (company_id, project_number);


--
-- TOC entry 4732 (class 2606 OID 26507)
-- Name: projects projects_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4734 (class 2606 OID 26503)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 27198)
-- Name: purchase_order_lines purchase_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 27167)
-- Name: purchase_orders purchase_orders_company_id_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_company_id_po_number_key UNIQUE (company_id, po_number);


--
-- TOC entry 4832 (class 2606 OID 27165)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4623 (class 2606 OID 25979)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4625 (class 2606 OID 25981)
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4721 (class 2606 OID 26482)
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4723 (class 2606 OID 26484)
-- Name: subscription_payments subscription_payments_razorpay_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_razorpay_order_id_key UNIQUE (razorpay_order_id);


--
-- TOC entry 4796 (class 2606 OID 26885)
-- Name: suppliers suppliers_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_id_company_id_key UNIQUE (id, company_id);


--
-- TOC entry 4798 (class 2606 OID 26883)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4666 (class 2606 OID 26179)
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 4658 (class 2606 OID 26140)
-- Name: units_of_measure units_of_measure_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_pkey PRIMARY KEY (id);


--
-- TOC entry 4656 (class 2606 OID 26123)
-- Name: expense_categories uq_expense_categories; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT uq_expense_categories UNIQUE NULLS NOT DISTINCT (company_id, code);


--
-- TOC entry 4664 (class 2606 OID 26161)
-- Name: payment_methods uq_payment_methods; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT uq_payment_methods UNIQUE NULLS NOT DISTINCT (company_id, code);


--
-- TOC entry 4755 (class 2606 OID 26892)
-- Name: project_expenses uq_project_expenses_id_company; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT uq_project_expenses_id_company UNIQUE (id, company_id);


--
-- TOC entry 4673 (class 2606 OID 27739)
-- Name: project_stage_templates uq_project_stage_templates; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stage_templates
    ADD CONSTRAINT uq_project_stage_templates UNIQUE NULLS NOT DISTINCT (company_id, project_type_id, business_model, template_code);


--
-- TOC entry 4652 (class 2606 OID 26104)
-- Name: project_types uq_project_types; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT uq_project_types UNIQUE NULLS NOT DISTINCT (company_id, code);


--
-- TOC entry 4769 (class 2606 OID 26919)
-- Name: project_receipts uq_receipts_id_company; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT uq_receipts_id_company UNIQUE (id, company_id);


--
-- TOC entry 4668 (class 2606 OID 26181)
-- Name: tax_rates uq_tax_rates; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT uq_tax_rates UNIQUE NULLS NOT DISTINCT (company_id, code, effective_from);


--
-- TOC entry 4660 (class 2606 OID 26142)
-- Name: units_of_measure uq_units_of_measure; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT uq_units_of_measure UNIQUE NULLS NOT DISTINCT (company_id, code);


--
-- TOC entry 4618 (class 2606 OID 25963)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4620 (class 2606 OID 25965)
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 4614 (class 2606 OID 25953)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4616 (class 2606 OID 25951)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4286 (class 2606 OID 17264)
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- TOC entry 4547 (class 2606 OID 17266)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4552 (class 2606 OID 17268)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4549 (class 2606 OID 17270)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4853 (class 2606 OID 27518)
-- Name: bucket_lifecycle_states bucket_lifecycle_states_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_pkey PRIMARY KEY (bucket_id);


--
-- TOC entry 4578 (class 2606 OID 17460)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4560 (class 2606 OID 17302)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4581 (class 2606 OID 17436)
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 27541)
-- Name: lifecycle_abandoned_artifacts lifecycle_abandoned_artifacts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.lifecycle_abandoned_artifacts
    ADD CONSTRAINT lifecycle_abandoned_artifacts_pkey PRIMARY KEY (bucket_id, key);


--
-- TOC entry 4555 (class 2606 OID 17293)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4557 (class 2606 OID 17291)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4571 (class 2606 OID 17314)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4576 (class 2606 OID 17376)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4574 (class 2606 OID 17361)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4584 (class 2606 OID 17446)
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- TOC entry 4447 (class 1259 OID 16536)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 4417 (class 1259 OID 16710)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4529 (class 1259 OID 17125)
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- TOC entry 4530 (class 1259 OID 17124)
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- TOC entry 4531 (class 1259 OID 17122)
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- TOC entry 4536 (class 1259 OID 17123)
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- TOC entry 4418 (class 1259 OID 16712)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4419 (class 1259 OID 16713)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4465 (class 1259 OID 16791)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 4498 (class 1259 OID 16899)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 4453 (class 1259 OID 16879)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 5548 (class 0 OID 0)
-- Dependencies: 4453
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 4458 (class 1259 OID 16707)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4501 (class 1259 OID 16896)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4526 (class 1259 OID 17081)
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- TOC entry 4502 (class 1259 OID 16897)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 4420 (class 1259 OID 17168)
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- TOC entry 4421 (class 1259 OID 17167)
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- TOC entry 4422 (class 1259 OID 17169)
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- TOC entry 4423 (class 1259 OID 17170)
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- TOC entry 4473 (class 1259 OID 16902)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 4470 (class 1259 OID 16763)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 4471 (class 1259 OID 16908)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 4612 (class 1259 OID 25587)
-- Name: mfa_recovery_codes_set_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id);


--
-- TOC entry 4512 (class 1259 OID 17033)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 4509 (class 1259 OID 16986)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4519 (class 1259 OID 17059)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4520 (class 1259 OID 17057)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4525 (class 1259 OID 17058)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 4503 (class 1259 OID 27696)
-- Name: one_time_tokens_link_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_link_token_hash_hash_idx ON auth.one_time_tokens USING hash (link_token_hash);


--
-- TOC entry 4506 (class 1259 OID 16955)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 4507 (class 1259 OID 16954)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 4508 (class 1259 OID 16956)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 4424 (class 1259 OID 16714)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4425 (class 1259 OID 16711)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4434 (class 1259 OID 16519)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 4435 (class 1259 OID 16520)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 4436 (class 1259 OID 16706)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 4439 (class 1259 OID 16793)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 4442 (class 1259 OID 16898)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 4492 (class 1259 OID 16835)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 4493 (class 1259 OID 16900)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 4494 (class 1259 OID 16850)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 4497 (class 1259 OID 16849)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 4598 (class 1259 OID 25548)
-- Name: scim_tokens_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at);


--
-- TOC entry 4601 (class 1259 OID 25549)
-- Name: scim_tokens_revoked_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at);


--
-- TOC entry 4602 (class 1259 OID 25547)
-- Name: scim_tokens_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id);


--
-- TOC entry 4603 (class 1259 OID 25546)
-- Name: scim_tokens_token_hash_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash);


--
-- TOC entry 4587 (class 1259 OID 25526)
-- Name: scim_users_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4588 (class 1259 OID 25529)
-- Name: scim_users_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at);


--
-- TOC entry 4589 (class 1259 OID 25522)
-- Name: scim_users_external_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- TOC entry 4590 (class 1259 OID 25524)
-- Name: scim_users_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4593 (class 1259 OID 25528)
-- Name: scim_users_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id);


--
-- TOC entry 4594 (class 1259 OID 25527)
-- Name: scim_users_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4595 (class 1259 OID 25523)
-- Name: scim_users_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id);


--
-- TOC entry 4596 (class 1259 OID 25525)
-- Name: scim_users_user_name_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL);


--
-- TOC entry 4597 (class 1259 OID 25521)
-- Name: scim_users_user_name_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4459 (class 1259 OID 16901)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 4460 (class 1259 OID 17071)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 4463 (class 1259 OID 16792)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 4484 (class 1259 OID 16817)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 4487 (class 1259 OID 16816)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 4482 (class 1259 OID 16802)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 4483 (class 1259 OID 16964)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 4472 (class 1259 OID 16961)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 4464 (class 1259 OID 16790)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 4426 (class 1259 OID 16870)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 5549 (class 0 OID 0)
-- Dependencies: 4426
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 4427 (class 1259 OID 16708)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 4428 (class 1259 OID 16509)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 4429 (class 1259 OID 16925)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4541 (class 1259 OID 17165)
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- TOC entry 4544 (class 1259 OID 17164)
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- TOC entry 4537 (class 1259 OID 17147)
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- TOC entry 4540 (class 1259 OID 17148)
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- TOC entry 4775 (class 1259 OID 27851)
-- Name: idx_attachments_expense_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attachments_expense_project ON public.project_attachments USING btree (expense_id, project_id);


--
-- TOC entry 4776 (class 1259 OID 27852)
-- Name: idx_attachments_progress_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attachments_progress_project ON public.project_attachments USING btree (progress_update_id, project_id);


--
-- TOC entry 4777 (class 1259 OID 27853)
-- Name: idx_attachments_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attachments_project ON public.project_attachments USING btree (project_id);


--
-- TOC entry 4712 (class 1259 OID 27894)
-- Name: idx_booking_receipt_details_project_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_receipt_details_project_unit ON public.booking_receipt_details USING btree (project_unit_id);


--
-- TOC entry 4646 (class 1259 OID 27892)
-- Name: idx_customers_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_company ON public.customers USING btree (company_id);


--
-- TOC entry 4647 (class 1259 OID 27145)
-- Name: idx_customers_company_party_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_customers_company_party_unique ON public.customers USING btree (company_id, party_id) WHERE (party_id IS NOT NULL);


--
-- TOC entry 4648 (class 1259 OID 27859)
-- Name: idx_customers_party_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_party_company ON public.customers USING btree (party_id, company_id);


--
-- TOC entry 4703 (class 1259 OID 27888)
-- Name: idx_document_exclusions_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_exclusions_document ON public.document_exclusions USING btree (document_id);


--
-- TOC entry 4700 (class 1259 OID 27887)
-- Name: idx_document_inclusions_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_inclusions_document ON public.document_inclusions USING btree (document_id);


--
-- TOC entry 4694 (class 1259 OID 27885)
-- Name: idx_document_items_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_items_section ON public.document_items USING btree (section_id);


--
-- TOC entry 4691 (class 1259 OID 27886)
-- Name: idx_document_sections_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_sections_document ON public.document_sections USING btree (document_id);


--
-- TOC entry 4697 (class 1259 OID 27890)
-- Name: idx_document_specifications_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_specifications_document ON public.document_specifications USING btree (document_id);


--
-- TOC entry 4709 (class 1259 OID 27889)
-- Name: idx_document_terms_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_terms_document ON public.document_terms USING btree (document_id);


--
-- TOC entry 4684 (class 1259 OID 26828)
-- Name: idx_documents_company_type_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_company_type_status ON public.documents USING btree (company_id, document_type, status);


--
-- TOC entry 4685 (class 1259 OID 26827)
-- Name: idx_documents_company_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_company_updated ON public.documents USING btree (company_id, updated_at DESC);


--
-- TOC entry 4686 (class 1259 OID 27896)
-- Name: idx_documents_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_customer ON public.documents USING btree (customer_id);


--
-- TOC entry 4687 (class 1259 OID 27860)
-- Name: idx_documents_party_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_party_company ON public.documents USING btree (party_id, company_id);


--
-- TOC entry 4688 (class 1259 OID 27847)
-- Name: idx_documents_project_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_project_company ON public.documents USING btree (project_id, company_id);


--
-- TOC entry 4757 (class 1259 OID 27854)
-- Name: idx_expense_payments_expense_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_payments_expense_company ON public.project_expense_payments USING btree (project_expense_id, company_id);


--
-- TOC entry 4747 (class 1259 OID 27044)
-- Name: idx_expenses_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_company ON public.project_expenses USING btree (company_id);


--
-- TOC entry 4748 (class 1259 OID 27045)
-- Name: idx_expenses_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_supplier ON public.project_expenses USING btree (supplier_id);


--
-- TOC entry 4791 (class 1259 OID 26835)
-- Name: idx_investor_contrib_investor_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_investor_contrib_investor_date ON public.project_investor_contributions USING btree (project_investor_id, contribution_date DESC);


--
-- TOC entry 4815 (class 1259 OID 27052)
-- Name: idx_investors_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_investors_company ON public.investors USING btree (company_id);


--
-- TOC entry 4808 (class 1259 OID 27049)
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- TOC entry 4799 (class 1259 OID 27047)
-- Name: idx_invoices_company_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_company_date ON public.invoices USING btree (company_id, invoice_date DESC);


--
-- TOC entry 4800 (class 1259 OID 27048)
-- Name: idx_invoices_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_customer ON public.invoices USING btree (customer_id);


--
-- TOC entry 4801 (class 1259 OID 27848)
-- Name: idx_invoices_project_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_project_company ON public.invoices USING btree (project_id, company_id);


--
-- TOC entry 4847 (class 1259 OID 27279)
-- Name: idx_material_receipt_lines_po_line; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipt_lines_po_line ON public.material_receipt_lines USING btree (purchase_order_line_id, created_at DESC);


--
-- TOC entry 4848 (class 1259 OID 27278)
-- Name: idx_material_receipt_lines_receipt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipt_lines_receipt ON public.material_receipt_lines USING btree (material_receipt_id, purchase_order_line_id);


--
-- TOC entry 4838 (class 1259 OID 27850)
-- Name: idx_material_receipts_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipts_project ON public.material_receipts USING btree (project_id);


--
-- TOC entry 4839 (class 1259 OID 27276)
-- Name: idx_material_receipts_project_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipts_project_po ON public.material_receipts USING btree (company_id, project_id, purchase_order_id, receipt_date DESC);


--
-- TOC entry 4840 (class 1259 OID 27849)
-- Name: idx_material_receipts_purchase_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipts_purchase_order ON public.material_receipts USING btree (purchase_order_id);


--
-- TOC entry 4841 (class 1259 OID 27277)
-- Name: idx_material_receipts_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_receipts_supplier ON public.material_receipts USING btree (supplier_party_id, status);


--
-- TOC entry 4820 (class 1259 OID 27125)
-- Name: idx_parties_company_active_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parties_company_active_updated ON public.parties USING btree (company_id, is_active, updated_at DESC);


--
-- TOC entry 4821 (class 1259 OID 27126)
-- Name: idx_parties_company_role_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parties_company_role_lookup ON public.parties USING btree (company_id, is_customer, is_supplier, is_investor);


--
-- TOC entry 4822 (class 1259 OID 27127)
-- Name: idx_parties_company_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parties_company_search ON public.parties USING btree (company_id, name, email, mobile, gstin);


--
-- TOC entry 4626 (class 1259 OID 27884)
-- Name: idx_password_resets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_resets_user ON public.password_resets USING btree (user_id);


--
-- TOC entry 4811 (class 1259 OID 27050)
-- Name: idx_payment_allocations_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_allocations_invoice ON public.payment_allocations USING btree (invoice_id);


--
-- TOC entry 4812 (class 1259 OID 27051)
-- Name: idx_payment_allocations_receipt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_allocations_receipt ON public.payment_allocations USING btree (receipt_id);


--
-- TOC entry 4704 (class 1259 OID 27891)
-- Name: idx_payment_schedules_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_schedules_document ON public.payment_schedules USING btree (document_id);


--
-- TOC entry 4742 (class 1259 OID 26834)
-- Name: idx_progress_updates_project_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_progress_updates_project_date ON public.project_progress_updates USING btree (project_id, update_date DESC);


--
-- TOC entry 4743 (class 1259 OID 27856)
-- Name: idx_progress_updates_stage_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_progress_updates_stage_project ON public.project_progress_updates USING btree (stage_id, project_id);


--
-- TOC entry 4770 (class 1259 OID 27897)
-- Name: idx_project_client_access_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_client_access_user ON public.project_client_access USING btree (user_id);


--
-- TOC entry 4749 (class 1259 OID 27591)
-- Name: idx_project_expenses_company_expense_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_expenses_company_expense_type ON public.project_expenses USING btree (company_id, expense_type);


--
-- TOC entry 4750 (class 1259 OID 26831)
-- Name: idx_project_expenses_project_bill_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_expenses_project_bill_date ON public.project_expenses USING btree (project_id, bill_date DESC);


--
-- TOC entry 4751 (class 1259 OID 27592)
-- Name: idx_project_expenses_project_expense_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_expenses_project_expense_type ON public.project_expenses USING btree (project_id, expense_type);


--
-- TOC entry 4780 (class 1259 OID 27855)
-- Name: idx_project_investors_investor_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_investors_investor_company ON public.project_investors USING btree (investor_id, company_id);


--
-- TOC entry 4781 (class 1259 OID 27861)
-- Name: idx_project_investors_party_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_investors_party_company ON public.project_investors USING btree (party_id, company_id);


--
-- TOC entry 4782 (class 1259 OID 27134)
-- Name: idx_project_investors_project_party_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_project_investors_project_party_unique ON public.project_investors USING btree (project_id, party_id) WHERE (party_id IS NOT NULL);


--
-- TOC entry 4760 (class 1259 OID 26832)
-- Name: idx_project_receipts_project_received_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_receipts_project_received_date ON public.project_receipts USING btree (project_id, received_date DESC);


--
-- TOC entry 4669 (class 1259 OID 27882)
-- Name: idx_project_stage_templates_project_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_stage_templates_project_type ON public.project_stage_templates USING btree (project_type_id);


--
-- TOC entry 4736 (class 1259 OID 26833)
-- Name: idx_project_stages_project_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_stages_project_sequence ON public.project_stages USING btree (project_id, sequence_number);


--
-- TOC entry 4857 (class 1259 OID 27584)
-- Name: idx_project_units_company_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_company_project ON public.project_units USING btree (company_id, project_id, flat_no);


--
-- TOC entry 4858 (class 1259 OID 27583)
-- Name: idx_project_units_project_flat_no_case_insensitive; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_project_units_project_flat_no_case_insensitive ON public.project_units USING btree (project_id, lower(TRIM(BOTH FROM flat_no)));


--
-- TOC entry 4859 (class 1259 OID 27585)
-- Name: idx_project_units_project_share; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_project_share ON public.project_units USING btree (project_id, share_type, status);


--
-- TOC entry 4724 (class 1259 OID 27547)
-- Name: idx_projects_business_model; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_business_model ON public.projects USING btree (company_id, business_model) WHERE (business_model IS NOT NULL);


--
-- TOC entry 4725 (class 1259 OID 27564)
-- Name: idx_projects_company_id_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_projects_company_id_id ON public.projects USING btree (company_id, id);


--
-- TOC entry 4726 (class 1259 OID 26830)
-- Name: idx_projects_company_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_company_status ON public.projects USING btree (company_id, status);


--
-- TOC entry 4727 (class 1259 OID 26829)
-- Name: idx_projects_company_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_company_updated ON public.projects USING btree (company_id, updated_at DESC);


--
-- TOC entry 4728 (class 1259 OID 27895)
-- Name: idx_projects_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_customer ON public.projects USING btree (customer_id);


--
-- TOC entry 4834 (class 1259 OID 27206)
-- Name: idx_purchase_order_lines_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_order_lines_order ON public.purchase_order_lines USING btree (purchase_order_id, created_at);


--
-- TOC entry 4826 (class 1259 OID 27204)
-- Name: idx_purchase_orders_company_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_company_project ON public.purchase_orders USING btree (company_id, project_id, created_at DESC);


--
-- TOC entry 4827 (class 1259 OID 27858)
-- Name: idx_purchase_orders_project_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_project_company ON public.purchase_orders USING btree (project_id, company_id);


--
-- TOC entry 4828 (class 1259 OID 27205)
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_party_id, status);


--
-- TOC entry 4761 (class 1259 OID 27046)
-- Name: idx_receipts_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_receipts_company ON public.project_receipts USING btree (company_id);


--
-- TOC entry 4762 (class 1259 OID 27857)
-- Name: idx_receipts_customer_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_receipts_customer_company ON public.project_receipts USING btree (customer_id, company_id);


--
-- TOC entry 4621 (class 1259 OID 27883)
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- TOC entry 4794 (class 1259 OID 27893)
-- Name: idx_suppliers_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_company ON public.suppliers USING btree (company_id);


--
-- TOC entry 4767 (class 1259 OID 27058)
-- Name: uq_company_level_receipt_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_company_level_receipt_number ON public.project_receipts USING btree (company_id, receipt_number) WHERE (project_id IS NULL);


--
-- TOC entry 4641 (class 1259 OID 27043)
-- Name: uq_company_users_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_company_users_user_id ON public.company_users USING btree (user_id);


--
-- TOC entry 4713 (class 1259 OID 27704)
-- Name: ux_active_booking_per_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_active_booking_per_unit ON public.booking_receipt_details USING btree (project_unit_id) WHERE ((project_unit_id IS NOT NULL) AND (booking_status = ANY (ARRAY['Confirmed'::text, 'Completed'::text])));


--
-- TOC entry 4846 (class 1259 OID 27759)
-- Name: ux_material_receipts_id_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_material_receipts_id_po ON public.material_receipts USING btree (id, purchase_order_id);


--
-- TOC entry 4825 (class 1259 OID 27756)
-- Name: ux_parties_id_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_parties_id_company ON public.parties USING btree (id, company_id);


--
-- TOC entry 4746 (class 1259 OID 27754)
-- Name: ux_progress_updates_id_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_progress_updates_id_project ON public.project_progress_updates USING btree (id, project_id);


--
-- TOC entry 4756 (class 1259 OID 27755)
-- Name: ux_project_expenses_id_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_project_expenses_id_project ON public.project_expenses USING btree (id, project_id);


--
-- TOC entry 4741 (class 1259 OID 27753)
-- Name: ux_project_stages_id_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_project_stages_id_project ON public.project_stages USING btree (id, project_id);


--
-- TOC entry 4735 (class 1259 OID 26533)
-- Name: ux_projects_company_source_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_projects_company_source_document ON public.projects USING btree (company_id, source_document_id) WHERE (source_document_id IS NOT NULL);


--
-- TOC entry 4837 (class 1259 OID 27758)
-- Name: ux_purchase_order_lines_id_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_purchase_order_lines_id_po ON public.purchase_order_lines USING btree (id, purchase_order_id);


--
-- TOC entry 4833 (class 1259 OID 27757)
-- Name: ux_purchase_orders_id_company_project_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_purchase_orders_id_company_project_supplier ON public.purchase_orders USING btree (id, company_id, project_id, supplier_party_id);


--
-- TOC entry 4550 (class 1259 OID 17271)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4545 (class 1259 OID 17272)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4553 (class 1259 OID 17273)
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- TOC entry 4558 (class 1259 OID 17303)
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4851 (class 1259 OID 27524)
-- Name: bucket_lifecycle_states_due_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX bucket_lifecycle_states_due_idx ON storage.bucket_lifecycle_states USING btree (next_run_at, bucket_id) WHERE (next_run_at IS NOT NULL);


--
-- TOC entry 4579 (class 1259 OID 17461)
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4572 (class 1259 OID 17387)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4561 (class 1259 OID 17352)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4562 (class 1259 OID 17468)
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- TOC entry 4563 (class 1259 OID 25479)
-- Name: idx_objects_current_version; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL);


--
-- TOC entry 4564 (class 1259 OID 25498)
-- Name: idx_objects_delete_markers; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker;


--
-- TOC entry 4565 (class 1259 OID 25480)
-- Name: idx_objects_null_version; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned);


--
-- TOC entry 4854 (class 1259 OID 27542)
-- Name: lifecycle_abandoned_artifacts_attempted_at_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX lifecycle_abandoned_artifacts_attempted_at_idx ON storage.lifecycle_abandoned_artifacts USING btree (attempted_at);


--
-- TOC entry 4566 (class 1259 OID 17321)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4567 (class 1259 OID 27526)
-- Name: objects_archived_due_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX objects_archived_due_idx ON storage.objects USING btree (bucket_id, archived_at, name COLLATE "C") INCLUDE (id, version, is_delete_marker) WHERE (archived_at IS NOT NULL);


--
-- TOC entry 4568 (class 1259 OID 27525)
-- Name: objects_archived_order_uq; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_archived_order_uq ON storage.objects USING btree (bucket_id, name COLLATE "C", archived_at) WHERE (archived_at IS NOT NULL);


--
-- TOC entry 4569 (class 1259 OID 25478)
-- Name: objects_bucket_id_name_version_key; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;


--
-- TOC entry 4582 (class 1259 OID 17452)
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- TOC entry 5062 (class 2620 OID 27281)
-- Name: material_receipt_lines set_material_receipt_lines_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_material_receipt_lines_updated_at BEFORE UPDATE ON public.material_receipt_lines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5061 (class 2620 OID 27280)
-- Name: material_receipts set_material_receipts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_material_receipts_updated_at BEFORE UPDATE ON public.material_receipts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5058 (class 2620 OID 27128)
-- Name: parties set_parties_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_parties_updated_at BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5064 (class 2620 OID 27586)
-- Name: project_units set_project_units_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_project_units_updated_at BEFORE UPDATE ON public.project_units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5060 (class 2620 OID 27208)
-- Name: purchase_order_lines set_purchase_order_lines_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_purchase_order_lines_updated_at BEFORE UPDATE ON public.purchase_order_lines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5059 (class 2620 OID 27207)
-- Name: purchase_orders set_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5054 (class 2620 OID 26817)
-- Name: project_attachments trg_attachment_link_validation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_attachment_link_validation BEFORE INSERT OR UPDATE OF progress_update_id, expense_id, project_id ON public.project_attachments FOR EACH ROW EXECUTE FUNCTION public.validate_attachment_links();


--
-- TOC entry 5053 (class 2620 OID 26855)
-- Name: project_client_access trg_client_access_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_client_access_updated_at BEFORE UPDATE ON public.project_client_access FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5019 (class 2620 OID 26838)
-- Name: companies trg_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5020 (class 2620 OID 26839)
-- Name: company_settings trg_company_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5035 (class 2620 OID 26857)
-- Name: company_subscriptions trg_company_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_company_subscriptions_updated_at BEFORE UPDATE ON public.company_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5036 (class 2620 OID 26858)
-- Name: company_quotation_usage trg_company_usage_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_company_usage_updated_at BEFORE UPDATE ON public.company_quotation_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5021 (class 2620 OID 26840)
-- Name: company_users trg_company_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_company_users_updated_at BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5022 (class 2620 OID 26841)
-- Name: customers trg_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5034 (class 2620 OID 26826)
-- Name: document_items trg_document_items_unit_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_document_items_unit_scope BEFORE INSERT OR UPDATE OF unit_id, section_id ON public.document_items FOR EACH ROW EXECUTE FUNCTION public.validate_document_item_unit_scope();


--
-- TOC entry 5030 (class 2620 OID 26848)
-- Name: document_sequences trg_document_sequences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_document_sequences_updated_at BEFORE UPDATE ON public.document_sequences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5031 (class 2620 OID 26819)
-- Name: documents trg_documents_customer_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_documents_customer_scope BEFORE INSERT OR UPDATE OF customer_id, company_id ON public.documents FOR EACH ROW EXECUTE FUNCTION public.validate_document_customer_scope();


--
-- TOC entry 5032 (class 2620 OID 26818)
-- Name: documents trg_documents_master_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_documents_master_scope BEFORE INSERT OR UPDATE OF project_type_id, area_unit_id, tax_rate_id, company_id ON public.documents FOR EACH ROW EXECUTE FUNCTION public.validate_document_master_scope();


--
-- TOC entry 5033 (class 2620 OID 26849)
-- Name: documents trg_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5056 (class 2620 OID 27828)
-- Name: invoices trg_enforce_invoice_allocation_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_invoice_allocation_balance BEFORE UPDATE OF grand_total, status ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_allocation_balance();


--
-- TOC entry 5057 (class 2620 OID 27824)
-- Name: payment_allocations trg_enforce_payment_allocation_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_payment_allocation_balance BEFORE INSERT OR DELETE OR UPDATE ON public.payment_allocations FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_allocation_balance();


--
-- TOC entry 5045 (class 2620 OID 27826)
-- Name: project_expenses trg_enforce_project_expense_bill_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_project_expense_bill_balance BEFORE UPDATE OF bill_amount, status, voided_at ON public.project_expenses FOR EACH ROW EXECUTE FUNCTION public.enforce_project_expense_bill_balance();


--
-- TOC entry 5048 (class 2620 OID 27825)
-- Name: project_expense_payments trg_enforce_project_expense_payment_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_project_expense_payment_balance BEFORE INSERT OR DELETE OR UPDATE ON public.project_expense_payments FOR EACH ROW EXECUTE FUNCTION public.enforce_project_expense_payment_balance();


--
-- TOC entry 5050 (class 2620 OID 27827)
-- Name: project_receipts trg_enforce_project_receipt_allocation_balance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_project_receipt_allocation_balance BEFORE UPDATE OF amount, voided_at ON public.project_receipts FOR EACH ROW EXECUTE FUNCTION public.enforce_project_receipt_allocation_balance();


--
-- TOC entry 5024 (class 2620 OID 26843)
-- Name: expense_categories trg_expense_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5049 (class 2620 OID 26825)
-- Name: project_expense_payments trg_expense_payments_method_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_expense_payments_method_scope BEFORE INSERT OR UPDATE OF payment_method_id, project_expense_id ON public.project_expense_payments FOR EACH ROW EXECUTE FUNCTION public.validate_payment_method_scope();


--
-- TOC entry 5046 (class 2620 OID 26823)
-- Name: project_expenses trg_expenses_master_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_expenses_master_scope BEFORE INSERT OR UPDATE OF category_id, project_id ON public.project_expenses FOR EACH ROW EXECUTE FUNCTION public.validate_expense_master_scope();


--
-- TOC entry 5047 (class 2620 OID 26853)
-- Name: project_expenses trg_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.project_expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5055 (class 2620 OID 26856)
-- Name: project_investors trg_investors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_investors_updated_at BEFORE UPDATE ON public.project_investors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5026 (class 2620 OID 26845)
-- Name: payment_methods trg_payment_methods_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5043 (class 2620 OID 26816)
-- Name: project_progress_updates trg_progress_stage_validation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_progress_stage_validation BEFORE INSERT OR UPDATE OF stage_id, project_id ON public.project_progress_updates FOR EACH ROW EXECUTE FUNCTION public.validate_progress_stage_link();


--
-- TOC entry 5044 (class 2620 OID 26852)
-- Name: project_progress_updates trg_progress_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON public.project_progress_updates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5023 (class 2620 OID 26842)
-- Name: project_types trg_project_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_project_types_updated_at BEFORE UPDATE ON public.project_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5038 (class 2620 OID 26821)
-- Name: projects trg_projects_customer_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_projects_customer_scope BEFORE INSERT OR UPDATE OF customer_id, company_id ON public.projects FOR EACH ROW EXECUTE FUNCTION public.validate_project_customer_scope();


--
-- TOC entry 5039 (class 2620 OID 26820)
-- Name: projects trg_projects_master_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_projects_master_scope BEFORE INSERT OR UPDATE OF project_type_id, company_id ON public.projects FOR EACH ROW EXECUTE FUNCTION public.validate_project_master_scope();


--
-- TOC entry 5040 (class 2620 OID 26815)
-- Name: projects trg_projects_source_validation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_projects_source_validation BEFORE INSERT OR UPDATE OF source_document_id, company_id ON public.projects FOR EACH ROW EXECUTE FUNCTION public.validate_project_source_quotation();


--
-- TOC entry 5041 (class 2620 OID 26850)
-- Name: projects trg_projects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5051 (class 2620 OID 26824)
-- Name: project_receipts trg_receipts_method_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_receipts_method_scope BEFORE INSERT OR UPDATE OF payment_method_id, project_id ON public.project_receipts FOR EACH ROW EXECUTE FUNCTION public.validate_payment_method_scope();


--
-- TOC entry 5052 (class 2620 OID 26854)
-- Name: project_receipts trg_receipts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_receipts_updated_at BEFORE UPDATE ON public.project_receipts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5063 (class 2620 OID 27808)
-- Name: material_receipt_lines trg_set_material_receipt_line_purchase_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_set_material_receipt_line_purchase_order BEFORE INSERT OR UPDATE OF material_receipt_id, purchase_order_line_id ON public.material_receipt_lines FOR EACH ROW EXECUTE FUNCTION public.set_material_receipt_line_purchase_order();


--
-- TOC entry 5028 (class 2620 OID 26822)
-- Name: project_stage_templates trg_stage_templates_scope; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_stage_templates_scope BEFORE INSERT OR UPDATE OF company_id, project_type_id ON public.project_stage_templates FOR EACH ROW EXECUTE FUNCTION public.validate_stage_template_scope();


--
-- TOC entry 5029 (class 2620 OID 26847)
-- Name: project_stage_templates trg_stage_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_stage_templates_updated_at BEFORE UPDATE ON public.project_stage_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5042 (class 2620 OID 26851)
-- Name: project_stages trg_stages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_stages_updated_at BEFORE UPDATE ON public.project_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5037 (class 2620 OID 26859)
-- Name: subscription_payments trg_subscription_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_subscription_payments_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5027 (class 2620 OID 26846)
-- Name: tax_rates trg_tax_rates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tax_rates_updated_at BEFORE UPDATE ON public.tax_rates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5025 (class 2620 OID 26844)
-- Name: units_of_measure trg_units_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_units_updated_at BEFORE UPDATE ON public.units_of_measure FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5018 (class 2620 OID 26837)
-- Name: user_profiles trg_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5017 (class 2620 OID 26836)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5005 (class 2620 OID 17274)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 5006 (class 2620 OID 17406)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 5007 (class 2620 OID 27286)
-- Name: buckets enforce_versioning_status_transition; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_versioning_status_transition BEFORE UPDATE OF versioning_status ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_versioning_status_transition();


--
-- TOC entry 5008 (class 2620 OID 27528)
-- Name: buckets protect_active_lifecycle_states; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_active_lifecycle_states BEFORE DELETE ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_active_lifecycle_states();


--
-- TOC entry 5009 (class 2620 OID 25486)
-- Name: buckets protect_bucket_control_insert; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role');


--
-- TOC entry 5010 (class 2620 OID 25487)
-- Name: buckets protect_bucket_control_update; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns();


--
-- TOC entry 5011 (class 2620 OID 25488)
-- Name: buckets protect_bucket_control_update_role; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role');


--
-- TOC entry 5012 (class 2620 OID 17470)
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 5015 (class 2620 OID 17471)
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 5016 (class 2620 OID 17340)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 5013 (class 2620 OID 27532)
-- Name: buckets wake_lifecycle_on_policy_write; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER wake_lifecycle_on_policy_write AFTER INSERT OR UPDATE OF lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- TOC entry 5014 (class 2620 OID 27531)
-- Name: buckets wake_lifecycle_on_versioning_enable; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER wake_lifecycle_on_versioning_enable AFTER UPDATE OF versioning_status ON storage.buckets FOR EACH ROW WHEN ((new.lifecycle_configuration IS NOT NULL)) EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- TOC entry 4863 (class 2606 OID 16694)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4868 (class 2606 OID 16783)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4867 (class 2606 OID 16771)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4866 (class 2606 OID 16758)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 25569)
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_fkey FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 25564)
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 25582)
-- Name: mfa_recovery_codes mfa_recovery_codes_mfa_recovery_code_set_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_mfa_recovery_code_set_id_fkey FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 17023)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4875 (class 2606 OID 17028)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 2606 OID 17052)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4877 (class 2606 OID 17047)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 16949)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4862 (class 2606 OID 16727)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4870 (class 2606 OID 16830)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4871 (class 2606 OID 16903)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 16844)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 25541)
-- Name: scim_tokens scim_tokens_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4886 (class 2606 OID 25511)
-- Name: scim_users scim_users_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 25516)
-- Name: scim_users scim_users_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4864 (class 2606 OID 17066)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4865 (class 2606 OID 16722)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 16811)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4879 (class 2606 OID 17159)
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4878 (class 2606 OID 17142)
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 26426)
-- Name: booking_receipt_details booking_receipt_details_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_receipt_details
    ADD CONSTRAINT booking_receipt_details_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4895 (class 2606 OID 26018)
-- Name: companies companies_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- TOC entry 4929 (class 2606 OID 26464)
-- Name: company_quotation_usage company_quotation_usage_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_quotation_usage
    ADD CONSTRAINT company_quotation_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4896 (class 2606 OID 26038)
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 26445)
-- Name: company_subscriptions company_subscriptions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4897 (class 2606 OID 26058)
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 26063)
-- Name: company_users company_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 26081)
-- Name: customers customers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4900 (class 2606 OID 26086)
-- Name: customers customers_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- TOC entry 4923 (class 2606 OID 26382)
-- Name: document_exclusions document_exclusions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_exclusions
    ADD CONSTRAINT document_exclusions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 26369)
-- Name: document_inclusions document_inclusions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_inclusions
    ADD CONSTRAINT document_inclusions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 26336)
-- Name: document_items document_items_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.document_sections(id) ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 26341)
-- Name: document_items document_items_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units_of_measure(id) ON DELETE SET NULL;


--
-- TOC entry 4918 (class 2606 OID 26315)
-- Name: document_sections document_sections_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sections
    ADD CONSTRAINT document_sections_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 26228)
-- Name: document_sequences document_sequences_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4921 (class 2606 OID 26356)
-- Name: document_specifications document_specifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_specifications
    ADD CONSTRAINT document_specifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 26414)
-- Name: document_terms document_terms_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_terms
    ADD CONSTRAINT document_terms_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 26285)
-- Name: documents documents_area_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_area_unit_id_fkey FOREIGN KEY (area_unit_id) REFERENCES public.units_of_measure(id) ON DELETE SET NULL;


--
-- TOC entry 4911 (class 2606 OID 26275)
-- Name: documents documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- TOC entry 4912 (class 2606 OID 26295)
-- Name: documents documents_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- TOC entry 4913 (class 2606 OID 26280)
-- Name: documents documents_project_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES public.project_types(id) ON DELETE SET NULL;


--
-- TOC entry 4914 (class 2606 OID 26290)
-- Name: documents documents_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE SET NULL;


--
-- TOC entry 4903 (class 2606 OID 26124)
-- Name: expense_categories expense_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 27011)
-- Name: payment_allocations fk_allocation_invoice_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT fk_allocation_invoice_company FOREIGN KEY (invoice_id, company_id) REFERENCES public.invoices(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4982 (class 2606 OID 27016)
-- Name: payment_allocations fk_allocation_receipt_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT fk_allocation_receipt_company FOREIGN KEY (receipt_id, company_id) REFERENCES public.project_receipts(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4963 (class 2606 OID 27765)
-- Name: project_attachments fk_attachments_expense_project; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT fk_attachments_expense_project FOREIGN KEY (expense_id, project_id) REFERENCES public.project_expenses(id, project_id) ON DELETE SET NULL (expense_id);


--
-- TOC entry 4964 (class 2606 OID 27770)
-- Name: project_attachments fk_attachments_progress_project; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT fk_attachments_progress_project FOREIGN KEY (progress_update_id, project_id) REFERENCES public.project_progress_updates(id, project_id) ON DELETE SET NULL (progress_update_id);


--
-- TOC entry 4927 (class 2606 OID 27697)
-- Name: booking_receipt_details fk_booking_receipt_details_project_unit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_receipt_details
    ADD CONSTRAINT fk_booking_receipt_details_project_unit FOREIGN KEY (project_unit_id) REFERENCES public.project_units(id) ON DELETE RESTRICT;


--
-- TOC entry 4901 (class 2606 OID 27862)
-- Name: customers fk_customers_party_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_party_company FOREIGN KEY (party_id, company_id) REFERENCES public.parties(id, company_id) ON DELETE SET NULL (party_id);


--
-- TOC entry 4915 (class 2606 OID 26300)
-- Name: documents fk_documents_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 4916 (class 2606 OID 27867)
-- Name: documents fk_documents_party_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_party_company FOREIGN KEY (party_id, company_id) REFERENCES public.parties(id, company_id) ON DELETE SET NULL (party_id);


--
-- TOC entry 4917 (class 2606 OID 27877)
-- Name: documents fk_documents_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id) ON DELETE SET NULL (project_id);


--
-- TOC entry 4949 (class 2606 OID 26908)
-- Name: project_expense_payments fk_expense_payments_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT fk_expense_payments_company FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4950 (class 2606 OID 26913)
-- Name: project_expense_payments fk_expense_payments_expense_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT fk_expense_payments_expense_company FOREIGN KEY (project_expense_id, company_id) REFERENCES public.project_expenses(id, company_id) ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 26893)
-- Name: project_expenses fk_expenses_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT fk_expenses_company FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4944 (class 2606 OID 26898)
-- Name: project_expenses fk_expenses_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT fk_expenses_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id) ON DELETE CASCADE;


--
-- TOC entry 4945 (class 2606 OID 26903)
-- Name: project_expenses fk_expenses_supplier_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT fk_expenses_supplier_company FOREIGN KEY (supplier_id, company_id) REFERENCES public.suppliers(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4974 (class 2606 OID 26799)
-- Name: project_investor_contributions fk_investor_contribution_owner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investor_contributions
    ADD CONSTRAINT fk_investor_contribution_owner FOREIGN KEY (project_investor_id, project_id, company_id) REFERENCES public.project_investors(id, project_id, company_id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 26964)
-- Name: invoices fk_invoice_customer_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoice_customer_company FOREIGN KEY (customer_id, company_id) REFERENCES public.customers(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4978 (class 2606 OID 26969)
-- Name: invoices fk_invoice_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoice_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4999 (class 2606 OID 27803)
-- Name: material_receipt_lines fk_material_receipt_lines_po_line_po; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipt_lines
    ADD CONSTRAINT fk_material_receipt_lines_po_line_po FOREIGN KEY (purchase_order_line_id, purchase_order_id) REFERENCES public.purchase_order_lines(id, purchase_order_id);


--
-- TOC entry 5000 (class 2606 OID 27798)
-- Name: material_receipt_lines fk_material_receipt_lines_receipt_po; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipt_lines
    ADD CONSTRAINT fk_material_receipt_lines_receipt_po FOREIGN KEY (material_receipt_id, purchase_order_id) REFERENCES public.material_receipts(id, purchase_order_id) ON DELETE CASCADE;


--
-- TOC entry 4993 (class 2606 OID 27786)
-- Name: material_receipts fk_material_receipts_po_context; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT fk_material_receipts_po_context FOREIGN KEY (purchase_order_id, company_id, project_id, supplier_party_id) REFERENCES public.purchase_orders(id, company_id, project_id, supplier_party_id);


--
-- TOC entry 4994 (class 2606 OID 27791)
-- Name: material_receipts fk_material_receipts_supplier_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT fk_material_receipts_supplier_company FOREIGN KEY (supplier_party_id, company_id) REFERENCES public.parties(id, company_id);


--
-- TOC entry 4938 (class 2606 OID 27760)
-- Name: project_progress_updates fk_progress_updates_stage_project; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT fk_progress_updates_stage_project FOREIGN KEY (stage_id, project_id) REFERENCES public.project_stages(id, project_id) ON DELETE SET NULL (stage_id);


--
-- TOC entry 4969 (class 2606 OID 27037)
-- Name: project_investors fk_project_investor_master; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT fk_project_investor_master FOREIGN KEY (investor_id, company_id) REFERENCES public.investors(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4970 (class 2606 OID 27872)
-- Name: project_investors fk_project_investors_party_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT fk_project_investors_party_company FOREIGN KEY (party_id, company_id) REFERENCES public.parties(id, company_id) ON DELETE SET NULL (party_id);


--
-- TOC entry 4971 (class 2606 OID 26778)
-- Name: project_investors fk_project_investors_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT fk_project_investors_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id) ON DELETE CASCADE;


--
-- TOC entry 4931 (class 2606 OID 26523)
-- Name: projects fk_projects_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 4932 (class 2606 OID 26528)
-- Name: projects fk_projects_source_document_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_source_document_company FOREIGN KEY (source_document_id, company_id) REFERENCES public.documents(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4987 (class 2606 OID 27776)
-- Name: purchase_orders fk_purchase_orders_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id);


--
-- TOC entry 4988 (class 2606 OID 27781)
-- Name: purchase_orders fk_purchase_orders_supplier_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_supplier_company FOREIGN KEY (supplier_party_id, company_id) REFERENCES public.parties(id, company_id);


--
-- TOC entry 4954 (class 2606 OID 26920)
-- Name: project_receipts fk_receipts_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT fk_receipts_company FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- TOC entry 4955 (class 2606 OID 27053)
-- Name: project_receipts fk_receipts_customer_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT fk_receipts_customer_company FOREIGN KEY (customer_id, company_id) REFERENCES public.customers(id, company_id) ON DELETE RESTRICT;


--
-- TOC entry 4956 (class 2606 OID 26925)
-- Name: project_receipts fk_receipts_project_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT fk_receipts_project_company FOREIGN KEY (project_id, company_id) REFERENCES public.projects(id, company_id) ON DELETE CASCADE;


--
-- TOC entry 4984 (class 2606 OID 27032)
-- Name: investors investors_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investors
    ADD CONSTRAINT investors_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 26993)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT;


--
-- TOC entry 4979 (class 2606 OID 26959)
-- Name: invoices invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- TOC entry 5001 (class 2606 OID 27266)
-- Name: material_receipt_lines material_receipt_lines_material_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipt_lines
    ADD CONSTRAINT material_receipt_lines_material_receipt_id_fkey FOREIGN KEY (material_receipt_id) REFERENCES public.material_receipts(id) ON DELETE CASCADE;


--
-- TOC entry 5002 (class 2606 OID 27271)
-- Name: material_receipt_lines material_receipt_lines_purchase_order_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipt_lines
    ADD CONSTRAINT material_receipt_lines_purchase_order_line_id_fkey FOREIGN KEY (purchase_order_line_id) REFERENCES public.purchase_order_lines(id) ON DELETE RESTRICT;


--
-- TOC entry 4995 (class 2606 OID 27224)
-- Name: material_receipts material_receipts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4996 (class 2606 OID 27229)
-- Name: material_receipts material_receipts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4997 (class 2606 OID 27234)
-- Name: material_receipts material_receipts_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE RESTRICT;


--
-- TOC entry 4998 (class 2606 OID 27239)
-- Name: material_receipts material_receipts_supplier_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_receipts
    ADD CONSTRAINT material_receipts_supplier_party_id_fkey FOREIGN KEY (supplier_party_id) REFERENCES public.parties(id) ON DELETE RESTRICT;


--
-- TOC entry 4985 (class 2606 OID 27115)
-- Name: parties parties_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4986 (class 2606 OID 27120)
-- Name: parties parties_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- TOC entry 4894 (class 2606 OID 25998)
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4983 (class 2606 OID 27006)
-- Name: payment_allocations payment_allocations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- TOC entry 4905 (class 2606 OID 26162)
-- Name: payment_methods payment_methods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 26399)
-- Name: payment_schedules payment_schedules_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4885 (class 2606 OID 17488)
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4965 (class 2606 OID 26737)
-- Name: project_attachments project_attachments_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT project_attachments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.project_expenses(id) ON DELETE SET NULL;


--
-- TOC entry 4966 (class 2606 OID 26732)
-- Name: project_attachments project_attachments_progress_update_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT project_attachments_progress_update_id_fkey FOREIGN KEY (progress_update_id) REFERENCES public.project_progress_updates(id) ON DELETE SET NULL;


--
-- TOC entry 4967 (class 2606 OID 26727)
-- Name: project_attachments project_attachments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT project_attachments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 26742)
-- Name: project_attachments project_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_attachments
    ADD CONSTRAINT project_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 4960 (class 2606 OID 26710)
-- Name: project_client_access project_client_access_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_client_access
    ADD CONSTRAINT project_client_access_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- TOC entry 4961 (class 2606 OID 26700)
-- Name: project_client_access project_client_access_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_client_access
    ADD CONSTRAINT project_client_access_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 26705)
-- Name: project_client_access project_client_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_client_access
    ADD CONSTRAINT project_client_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4951 (class 2606 OID 26648)
-- Name: project_expense_payments project_expense_payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT project_expense_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4952 (class 2606 OID 26643)
-- Name: project_expense_payments project_expense_payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT project_expense_payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;


--
-- TOC entry 4953 (class 2606 OID 26638)
-- Name: project_expense_payments project_expense_payments_project_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expense_payments
    ADD CONSTRAINT project_expense_payments_project_expense_id_fkey FOREIGN KEY (project_expense_id) REFERENCES public.project_expenses(id) ON DELETE CASCADE;


--
-- TOC entry 4946 (class 2606 OID 26616)
-- Name: project_expenses project_expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT project_expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL;


--
-- TOC entry 4947 (class 2606 OID 26621)
-- Name: project_expenses project_expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT project_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4948 (class 2606 OID 26611)
-- Name: project_expenses project_expenses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_expenses
    ADD CONSTRAINT project_expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4975 (class 2606 OID 26794)
-- Name: project_investor_contributions project_investor_contributions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investor_contributions
    ADD CONSTRAINT project_investor_contributions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4972 (class 2606 OID 26773)
-- Name: project_investors project_investors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4973 (class 2606 OID 26768)
-- Name: project_investors project_investors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4939 (class 2606 OID 26586)
-- Name: project_progress_updates project_progress_updates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT project_progress_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4940 (class 2606 OID 26576)
-- Name: project_progress_updates project_progress_updates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT project_progress_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4941 (class 2606 OID 26591)
-- Name: project_progress_updates project_progress_updates_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT project_progress_updates_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- TOC entry 4942 (class 2606 OID 26581)
-- Name: project_progress_updates project_progress_updates_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_progress_updates
    ADD CONSTRAINT project_progress_updates_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.project_stages(id) ON DELETE SET NULL;


--
-- TOC entry 4957 (class 2606 OID 26680)
-- Name: project_receipts project_receipts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT project_receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4958 (class 2606 OID 26675)
-- Name: project_receipts project_receipts_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT project_receipts_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;


--
-- TOC entry 4959 (class 2606 OID 26670)
-- Name: project_receipts project_receipts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_receipts
    ADD CONSTRAINT project_receipts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 26203)
-- Name: project_stage_templates project_stage_templates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stage_templates
    ADD CONSTRAINT project_stage_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 26208)
-- Name: project_stage_templates project_stage_templates_project_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stage_templates
    ADD CONSTRAINT project_stage_templates_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES public.project_types(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 26557)
-- Name: project_stages project_stages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stages
    ADD CONSTRAINT project_stages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4937 (class 2606 OID 26552)
-- Name: project_stages project_stages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stages
    ADD CONSTRAINT project_stages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4902 (class 2606 OID 26105)
-- Name: project_types project_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT project_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 27578)
-- Name: project_units project_units_company_project_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_company_project_fk FOREIGN KEY (company_id, project_id) REFERENCES public.projects(company_id, id) ON DELETE RESTRICT;


--
-- TOC entry 4933 (class 2606 OID 26508)
-- Name: projects projects_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- TOC entry 4934 (class 2606 OID 26518)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4935 (class 2606 OID 26513)
-- Name: projects projects_project_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES public.project_types(id) ON DELETE SET NULL;


--
-- TOC entry 4992 (class 2606 OID 27199)
-- Name: purchase_order_lines purchase_order_lines_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 4989 (class 2606 OID 27168)
-- Name: purchase_orders purchase_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4990 (class 2606 OID 27173)
-- Name: purchase_orders purchase_orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4991 (class 2606 OID 27178)
-- Name: purchase_orders purchase_orders_supplier_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_party_id_fkey FOREIGN KEY (supplier_party_id) REFERENCES public.parties(id) ON DELETE RESTRICT;


--
-- TOC entry 4893 (class 2606 OID 25982)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 26485)
-- Name: subscription_payments subscription_payments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- TOC entry 4976 (class 2606 OID 26886)
-- Name: suppliers suppliers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 2606 OID 26182)
-- Name: tax_rates tax_rates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4904 (class 2606 OID 26143)
-- Name: units_of_measure units_of_measure_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 4892 (class 2606 OID 25966)
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5003 (class 2606 OID 27519)
-- Name: bucket_lifecycle_states bucket_lifecycle_states_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) ON DELETE CASCADE;


--
-- TOC entry 4880 (class 2606 OID 17315)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4881 (class 2606 OID 17362)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4882 (class 2606 OID 17382)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4883 (class 2606 OID 17377)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4884 (class 2606 OID 17447)
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- TOC entry 5216 (class 0 OID 16529)
-- Dependencies: 261
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5227 (class 0 OID 16889)
-- Dependencies: 274
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5218 (class 0 OID 16687)
-- Dependencies: 265
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5215 (class 0 OID 16522)
-- Dependencies: 260
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5222 (class 0 OID 16776)
-- Dependencies: 269
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5221 (class 0 OID 16764)
-- Dependencies: 268
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5220 (class 0 OID 16751)
-- Dependencies: 267
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5228 (class 0 OID 16939)
-- Dependencies: 275
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5214 (class 0 OID 16511)
-- Dependencies: 259
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5225 (class 0 OID 16818)
-- Dependencies: 272
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5226 (class 0 OID 16836)
-- Dependencies: 273
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5217 (class 0 OID 16537)
-- Dependencies: 262
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5219 (class 0 OID 16717)
-- Dependencies: 266
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5224 (class 0 OID 16803)
-- Dependencies: 271
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5223 (class 0 OID 16794)
-- Dependencies: 270
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5213 (class 0 OID 16499)
-- Dependencies: 257
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5289 (class 3256 OID 17682)
-- Name: profiles Users manage own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own profile" ON public.profiles USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- TOC entry 5262 (class 0 OID 26419)
-- Dependencies: 326
-- Name: booking_receipt_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.booking_receipt_details ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5243 (class 0 OID 26003)
-- Dependencies: 307
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5264 (class 0 OID 26450)
-- Dependencies: 328
-- Name: company_quotation_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.company_quotation_usage ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5244 (class 0 OID 26023)
-- Dependencies: 308
-- Name: company_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5263 (class 0 OID 26431)
-- Dependencies: 327
-- Name: company_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5245 (class 0 OID 26043)
-- Dependencies: 309
-- Name: company_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5246 (class 0 OID 26068)
-- Dependencies: 310
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5259 (class 0 OID 26374)
-- Dependencies: 323
-- Name: document_exclusions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_exclusions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5258 (class 0 OID 26361)
-- Dependencies: 322
-- Name: document_inclusions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_inclusions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5256 (class 0 OID 26320)
-- Dependencies: 320
-- Name: document_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5255 (class 0 OID 26305)
-- Dependencies: 319
-- Name: document_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5253 (class 0 OID 26213)
-- Dependencies: 317
-- Name: document_sequences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5257 (class 0 OID 26346)
-- Dependencies: 321
-- Name: document_specifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_specifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5261 (class 0 OID 26404)
-- Dependencies: 325
-- Name: document_terms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_terms ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5254 (class 0 OID 26233)
-- Dependencies: 318
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5248 (class 0 OID 26110)
-- Dependencies: 312
-- Name: expense_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5280 (class 0 OID 27021)
-- Dependencies: 344
-- Name: investors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5278 (class 0 OID 26974)
-- Dependencies: 342
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5277 (class 0 OID 26935)
-- Dependencies: 341
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5285 (class 0 OID 27244)
-- Dependencies: 349
-- Name: material_receipt_lines; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.material_receipt_lines ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5284 (class 0 OID 27209)
-- Dependencies: 348
-- Name: material_receipts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.material_receipts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5281 (class 0 OID 27097)
-- Dependencies: 345
-- Name: parties; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5242 (class 0 OID 25987)
-- Dependencies: 306
-- Name: password_resets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5279 (class 0 OID 26998)
-- Dependencies: 343
-- Name: payment_allocations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5250 (class 0 OID 26148)
-- Dependencies: 314
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5260 (class 0 OID 26387)
-- Dependencies: 324
-- Name: payment_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5238 (class 0 OID 17479)
-- Dependencies: 298
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5273 (class 0 OID 26715)
-- Dependencies: 337
-- Name: project_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5272 (class 0 OID 26685)
-- Dependencies: 336
-- Name: project_client_access; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_client_access ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5270 (class 0 OID 26626)
-- Dependencies: 334
-- Name: project_expense_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_expense_payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5269 (class 0 OID 26596)
-- Dependencies: 333
-- Name: project_expenses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5275 (class 0 OID 26783)
-- Dependencies: 339
-- Name: project_investor_contributions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_investor_contributions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5274 (class 0 OID 26747)
-- Dependencies: 338
-- Name: project_investors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_investors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5268 (class 0 OID 26562)
-- Dependencies: 332
-- Name: project_progress_updates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_progress_updates ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5271 (class 0 OID 26653)
-- Dependencies: 335
-- Name: project_receipts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_receipts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5252 (class 0 OID 26187)
-- Dependencies: 316
-- Name: project_stage_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_stage_templates ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5267 (class 0 OID 26534)
-- Dependencies: 331
-- Name: project_stages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5247 (class 0 OID 26091)
-- Dependencies: 311
-- Name: project_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5288 (class 0 OID 27565)
-- Dependencies: 352
-- Name: project_units; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5266 (class 0 OID 26490)
-- Dependencies: 330
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5283 (class 0 OID 27183)
-- Dependencies: 347
-- Name: purchase_order_lines; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5282 (class 0 OID 27147)
-- Dependencies: 346
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5241 (class 0 OID 25971)
-- Dependencies: 305
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5265 (class 0 OID 26469)
-- Dependencies: 329
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5276 (class 0 OID 26875)
-- Dependencies: 340
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5251 (class 0 OID 26167)
-- Dependencies: 315
-- Name: tax_rates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5249 (class 0 OID 26129)
-- Dependencies: 313
-- Name: units_of_measure; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5240 (class 0 OID 25954)
-- Dependencies: 304
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5239 (class 0 OID 25937)
-- Dependencies: 303
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5229 (class 0 OID 17243)
-- Dependencies: 286
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5286 (class 0 OID 27506)
-- Dependencies: 350
-- Name: bucket_lifecycle_states; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.bucket_lifecycle_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5231 (class 0 OID 17294)
-- Dependencies: 291
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5235 (class 0 OID 17414)
-- Dependencies: 295
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5236 (class 0 OID 17427)
-- Dependencies: 296
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5287 (class 0 OID 27534)
-- Dependencies: 351
-- Name: lifecycle_abandoned_artifacts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.lifecycle_abandoned_artifacts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5230 (class 0 OID 17286)
-- Dependencies: 290
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5232 (class 0 OID 17304)
-- Dependencies: 292
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5233 (class 0 OID 17353)
-- Dependencies: 293
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5234 (class 0 OID 17367)
-- Dependencies: 294
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5237 (class 0 OID 17437)
-- Dependencies: 297
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5290 (class 6104 OID 16430)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 28
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 20
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 23
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 31
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA realtime TO authenticated;


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 29
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 25
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 417
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 430
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 416
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 415
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 411
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 412
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 383
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 413
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 387
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 389
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 380
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 379
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 386
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 388
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 390
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 391
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 384
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 385
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 422
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 419
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 382
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 381
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 367
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 366
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 368
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 414
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 410
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 404
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 406
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 408
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 405
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 407
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 409
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 400
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 402
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 401
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 403
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 396
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 398
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 397
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 399
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 392
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 394
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 393
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 395
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 420
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 421
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 423
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 374
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 375
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 376
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 377
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 378
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 369
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 370
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 372
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 371
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 373
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 429
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 353
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 365
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 490
-- Name: FUNCTION allocate_document_number(p_company_id uuid, p_document_type text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.allocate_document_number(p_company_id uuid, p_document_type text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.allocate_document_number(p_company_id uuid, p_document_type text) TO service_role;


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 494
-- Name: FUNCTION apply_receipt_allocation(p_company_id uuid, p_receipt_id uuid, p_invoice_id uuid, p_requested_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.apply_receipt_allocation(p_company_id uuid, p_receipt_id uuid, p_invoice_id uuid, p_requested_amount numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_receipt_allocation(p_company_id uuid, p_receipt_id uuid, p_invoice_id uuid, p_requested_amount numeric) TO service_role;


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 493
-- Name: FUNCTION cancel_booking_receipt_unit(p_document_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.cancel_booking_receipt_unit(p_document_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.cancel_booking_receipt_unit(p_document_id uuid) TO service_role;


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 492
-- Name: FUNCTION confirm_booking_receipt_unit(p_document_id uuid, p_project_unit_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.confirm_booking_receipt_unit(p_document_id uuid, p_project_unit_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.confirm_booking_receipt_unit(p_document_id uuid, p_project_unit_id uuid) TO service_role;


--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 484
-- Name: FUNCTION create_project_with_stages(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.create_project_with_stages(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_project_with_stages(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb) TO service_role;


--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 489
-- Name: FUNCTION create_project_with_stages_with_business_model(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb, p_business_model text, p_projected_sales_value numeric, p_land_cost numeric, p_development_arrangement text, p_total_project_flats integer, p_landowner_party_id uuid, p_jda_agreement_reference text, p_jda_agreement_document_url text, p_jda_agreement_date date, p_builder_share_units integer, p_landowner_share_units integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.create_project_with_stages_with_business_model(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb, p_business_model text, p_projected_sales_value numeric, p_land_cost numeric, p_development_arrangement text, p_total_project_flats integer, p_landowner_party_id uuid, p_jda_agreement_reference text, p_jda_agreement_document_url text, p_jda_agreement_date date, p_builder_share_units integer, p_landowner_share_units integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_project_with_stages_with_business_model(p_company_id uuid, p_created_by uuid, p_customer_id uuid, p_source_document_id uuid, p_project_type_id uuid, p_project_type_snapshot text, p_project_number text, p_name text, p_description text, p_site_address text, p_contract_amount numeric, p_budget_amount numeric, p_start_date date, p_expected_end_date date, p_actual_end_date date, p_status text, p_stage_drafts jsonb, p_business_model text, p_projected_sales_value numeric, p_land_cost numeric, p_development_arrangement text, p_total_project_flats integer, p_landowner_party_id uuid, p_jda_agreement_reference text, p_jda_agreement_document_url text, p_jda_agreement_date date, p_builder_share_units integer, p_landowner_share_units integer) TO service_role;


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 471
-- Name: FUNCTION current_app_user_id(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_app_user_id() TO service_role;


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION current_user_id(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.current_user_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_user_id() TO service_role;


--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 500
-- Name: FUNCTION enforce_invoice_allocation_balance(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_invoice_allocation_balance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_invoice_allocation_balance() TO service_role;


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 496
-- Name: FUNCTION enforce_payment_allocation_balance(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_payment_allocation_balance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_payment_allocation_balance() TO service_role;


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 498
-- Name: FUNCTION enforce_project_expense_bill_balance(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_project_expense_bill_balance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_project_expense_bill_balance() TO service_role;


--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 497
-- Name: FUNCTION enforce_project_expense_payment_balance(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_project_expense_payment_balance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_project_expense_payment_balance() TO service_role;


--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 499
-- Name: FUNCTION enforce_project_receipt_allocation_balance(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_project_receipt_allocation_balance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_project_receipt_allocation_balance() TO service_role;


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 458
-- Name: FUNCTION next_document_sequence(p_company_id uuid, p_document_type text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.next_document_sequence(p_company_id uuid, p_document_type text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.next_document_sequence(p_company_id uuid, p_document_type text) TO service_role;


--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 491
-- Name: FUNCTION save_quotation(p_company_id uuid, p_payload jsonb, p_expected_version integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_quotation(p_company_id uuid, p_payload jsonb, p_expected_version integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_quotation(p_company_id uuid, p_payload jsonb, p_expected_version integer) TO service_role;


--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 495
-- Name: FUNCTION set_material_receipt_line_purchase_order(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_material_receipt_line_purchase_order() FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_material_receipt_line_purchase_order() TO service_role;


--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 470
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION validate_attachment_links(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_attachment_links() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_attachment_links() TO service_role;


--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 476
-- Name: FUNCTION validate_document_customer_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_document_customer_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_document_customer_scope() TO service_role;


--
-- TOC entry 5394 (class 0 OID 0)
-- Dependencies: 482
-- Name: FUNCTION validate_document_item_unit_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_document_item_unit_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_document_item_unit_scope() TO service_role;


--
-- TOC entry 5395 (class 0 OID 0)
-- Dependencies: 475
-- Name: FUNCTION validate_document_master_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_document_master_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_document_master_scope() TO service_role;


--
-- TOC entry 5396 (class 0 OID 0)
-- Dependencies: 480
-- Name: FUNCTION validate_expense_master_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_expense_master_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_expense_master_scope() TO service_role;


--
-- TOC entry 5397 (class 0 OID 0)
-- Dependencies: 481
-- Name: FUNCTION validate_payment_method_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_payment_method_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_payment_method_scope() TO service_role;


--
-- TOC entry 5398 (class 0 OID 0)
-- Dependencies: 473
-- Name: FUNCTION validate_progress_stage_link(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_progress_stage_link() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_progress_stage_link() TO service_role;


--
-- TOC entry 5399 (class 0 OID 0)
-- Dependencies: 478
-- Name: FUNCTION validate_project_customer_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_project_customer_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_project_customer_scope() TO service_role;


--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 477
-- Name: FUNCTION validate_project_master_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_project_master_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_project_master_scope() TO service_role;


--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 472
-- Name: FUNCTION validate_project_source_quotation(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_project_source_quotation() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_project_source_quotation() TO service_role;


--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 479
-- Name: FUNCTION validate_stage_template_scope(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_stage_template_scope() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_stage_template_scope() TO service_role;


--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 431
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 469
-- Name: FUNCTION authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO postgres;
GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO dashboard_user;


--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 432
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 433
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 434
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- TOC entry 5408 (class 0 OID 0)
-- Dependencies: 435
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 436
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 437
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 438
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 468
-- Name: FUNCTION list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 439
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 440
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 441
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 467
-- Name: FUNCTION settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO postgres;
GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO dashboard_user;


--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 443
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 444
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 445
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 488
-- Name: FUNCTION delete_lifecycle_objects(object_ids uuid[]); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) TO postgres;
GRANT ALL ON FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) TO service_role;


--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 485
-- Name: FUNCTION protect_active_lifecycle_states(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON FUNCTION storage.protect_active_lifecycle_states() FROM PUBLIC;


--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 486
-- Name: FUNCTION reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) TO postgres;
GRANT ALL ON FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) TO service_role;


--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 487
-- Name: FUNCTION wake_lifecycle_state(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON FUNCTION storage.wake_lifecycle_state() FROM PUBLIC;


--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 425
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 427
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 428
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 280
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 274
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 301
-- Name: TABLE mfa_recovery_code_sets; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO dashboard_user;


--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 302
-- Name: TABLE mfa_recovery_codes; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_recovery_codes TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_codes TO dashboard_user;


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 277
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 279
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 276
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 278
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 275
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 258
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE scim_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.scim_tokens TO postgres;
GRANT ALL ON TABLE auth.scim_tokens TO dashboard_user;


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 299
-- Name: TABLE scim_users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.scim_users TO postgres;
GRANT ALL ON TABLE auth.scim_users TO dashboard_user;


--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 271
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 282
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 281
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 326
-- Name: TABLE booking_receipt_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.booking_receipt_details TO service_role;


--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 307
-- Name: TABLE companies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.companies TO service_role;


--
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 328
-- Name: TABLE company_quotation_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.company_quotation_usage TO service_role;


--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 308
-- Name: TABLE company_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.company_settings TO service_role;


--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 327
-- Name: TABLE company_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.company_subscriptions TO service_role;


--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 309
-- Name: TABLE company_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.company_users TO service_role;


--
-- TOC entry 5488 (class 0 OID 0)
-- Dependencies: 310
-- Name: TABLE customers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.customers TO service_role;


--
-- TOC entry 5489 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE document_exclusions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_exclusions TO service_role;


--
-- TOC entry 5490 (class 0 OID 0)
-- Dependencies: 322
-- Name: TABLE document_inclusions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_inclusions TO service_role;


--
-- TOC entry 5491 (class 0 OID 0)
-- Dependencies: 320
-- Name: TABLE document_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_items TO service_role;


--
-- TOC entry 5492 (class 0 OID 0)
-- Dependencies: 319
-- Name: TABLE document_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_sections TO service_role;


--
-- TOC entry 5493 (class 0 OID 0)
-- Dependencies: 317
-- Name: TABLE document_sequences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_sequences TO service_role;


--
-- TOC entry 5494 (class 0 OID 0)
-- Dependencies: 321
-- Name: TABLE document_specifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_specifications TO service_role;


--
-- TOC entry 5495 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE document_terms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_terms TO service_role;


--
-- TOC entry 5496 (class 0 OID 0)
-- Dependencies: 318
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO service_role;


--
-- TOC entry 5497 (class 0 OID 0)
-- Dependencies: 312
-- Name: TABLE expense_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.expense_categories TO service_role;


--
-- TOC entry 5498 (class 0 OID 0)
-- Dependencies: 344
-- Name: TABLE investors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.investors TO service_role;


--
-- TOC entry 5499 (class 0 OID 0)
-- Dependencies: 342
-- Name: TABLE invoice_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoice_items TO service_role;


--
-- TOC entry 5500 (class 0 OID 0)
-- Dependencies: 341
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoices TO service_role;


--
-- TOC entry 5501 (class 0 OID 0)
-- Dependencies: 349
-- Name: TABLE material_receipt_lines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.material_receipt_lines TO service_role;


--
-- TOC entry 5502 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE material_receipts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.material_receipts TO service_role;


--
-- TOC entry 5503 (class 0 OID 0)
-- Dependencies: 345
-- Name: TABLE parties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.parties TO service_role;


--
-- TOC entry 5504 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE password_resets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.password_resets TO service_role;


--
-- TOC entry 5505 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE payment_allocations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_allocations TO service_role;


--
-- TOC entry 5506 (class 0 OID 0)
-- Dependencies: 314
-- Name: TABLE payment_methods; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_methods TO service_role;


--
-- TOC entry 5507 (class 0 OID 0)
-- Dependencies: 324
-- Name: TABLE payment_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_schedules TO service_role;


--
-- TOC entry 5508 (class 0 OID 0)
-- Dependencies: 298
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO service_role;


--
-- TOC entry 5509 (class 0 OID 0)
-- Dependencies: 337
-- Name: TABLE project_attachments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_attachments TO service_role;


--
-- TOC entry 5510 (class 0 OID 0)
-- Dependencies: 336
-- Name: TABLE project_client_access; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_client_access TO service_role;


--
-- TOC entry 5511 (class 0 OID 0)
-- Dependencies: 334
-- Name: TABLE project_expense_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_expense_payments TO service_role;


--
-- TOC entry 5512 (class 0 OID 0)
-- Dependencies: 333
-- Name: TABLE project_expenses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_expenses TO service_role;


--
-- TOC entry 5513 (class 0 OID 0)
-- Dependencies: 339
-- Name: TABLE project_investor_contributions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_investor_contributions TO service_role;


--
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 338
-- Name: TABLE project_investors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_investors TO service_role;


--
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 332
-- Name: TABLE project_progress_updates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_progress_updates TO service_role;


--
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 335
-- Name: TABLE project_receipts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_receipts TO service_role;


--
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 316
-- Name: TABLE project_stage_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_stage_templates TO service_role;


--
-- TOC entry 5518 (class 0 OID 0)
-- Dependencies: 331
-- Name: TABLE project_stages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_stages TO service_role;


--
-- TOC entry 5519 (class 0 OID 0)
-- Dependencies: 311
-- Name: TABLE project_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_types TO service_role;


--
-- TOC entry 5520 (class 0 OID 0)
-- Dependencies: 352
-- Name: TABLE project_units; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_units TO service_role;


--
-- TOC entry 5521 (class 0 OID 0)
-- Dependencies: 330
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.projects TO service_role;


--
-- TOC entry 5522 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE purchase_order_lines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.purchase_order_lines TO service_role;


--
-- TOC entry 5523 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE purchase_orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.purchase_orders TO service_role;


--
-- TOC entry 5524 (class 0 OID 0)
-- Dependencies: 305
-- Name: TABLE refresh_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refresh_tokens TO service_role;


--
-- TOC entry 5525 (class 0 OID 0)
-- Dependencies: 329
-- Name: TABLE subscription_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscription_payments TO service_role;


--
-- TOC entry 5526 (class 0 OID 0)
-- Dependencies: 340
-- Name: TABLE suppliers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.suppliers TO service_role;


--
-- TOC entry 5527 (class 0 OID 0)
-- Dependencies: 315
-- Name: TABLE tax_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tax_rates TO service_role;


--
-- TOC entry 5528 (class 0 OID 0)
-- Dependencies: 313
-- Name: TABLE units_of_measure; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.units_of_measure TO service_role;


--
-- TOC entry 5529 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- TOC entry 5530 (class 0 OID 0)
-- Dependencies: 303
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO service_role;


--
-- TOC entry 5531 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- TOC entry 5532 (class 0 OID 0)
-- Dependencies: 287
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;


--
-- TOC entry 5533 (class 0 OID 0)
-- Dependencies: 288
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- TOC entry 5534 (class 0 OID 0)
-- Dependencies: 289
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- TOC entry 5535 (class 0 OID 0)
-- Dependencies: 350
-- Name: TABLE bucket_lifecycle_states; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.bucket_lifecycle_states TO postgres;
GRANT ALL ON TABLE storage.bucket_lifecycle_states TO service_role;


--
-- TOC entry 5537 (class 0 OID 0)
-- Dependencies: 291
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- TOC entry 5538 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO anon;


--
-- TOC entry 5539 (class 0 OID 0)
-- Dependencies: 296
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;


--
-- TOC entry 5540 (class 0 OID 0)
-- Dependencies: 351
-- Name: TABLE lifecycle_abandoned_artifacts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.lifecycle_abandoned_artifacts TO postgres;
GRANT ALL ON TABLE storage.lifecycle_abandoned_artifacts TO service_role;


--
-- TOC entry 5542 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- TOC entry 5543 (class 0 OID 0)
-- Dependencies: 293
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- TOC entry 5544 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- TOC entry 5545 (class 0 OID 0)
-- Dependencies: 297
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;


--
-- TOC entry 5546 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- TOC entry 5547 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- TOC entry 2639 (class 826 OID 16557)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2640 (class 826 OID 16558)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2638 (class 826 OID 16556)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2646 (class 826 OID 16636)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2645 (class 826 OID 16635)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- TOC entry 2644 (class 826 OID 16634)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2649 (class 826 OID 16591)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2648 (class 826 OID 16590)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2647 (class 826 OID 16589)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2641 (class 826 OID 16571)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2643 (class 826 OID 16570)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2642 (class 826 OID 16569)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2654 (class 826 OID 16494)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2632 (class 826 OID 16495)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2655 (class 826 OID 16493)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2634 (class 826 OID 16497)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2653 (class 826 OID 16492)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2633 (class 826 OID 16496)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2650 (class 826 OID 16561)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2651 (class 826 OID 16562)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2652 (class 826 OID 16560)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT SELECT,INSERT ON TABLES TO postgres WITH GRANT OPTION;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2637 (class 826 OID 16550)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2636 (class 826 OID 16549)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2635 (class 826 OID 16548)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 3868 (class 3466 OID 16575)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- TOC entry 3871 (class 3466 OID 16654)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- TOC entry 3873 (class 3466 OID 16666)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- TOC entry 3872 (class 3466 OID 16657)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- TOC entry 3869 (class 3466 OID 16576)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- TOC entry 3870 (class 3466 OID 16577)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

-- Completed on 2026-11-20 15:14:24

--
-- PostgreSQL database dump complete
--

