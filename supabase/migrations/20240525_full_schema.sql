--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: chat_channel_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_channel_type AS ENUM (
    'group',
    'dm'
);


--
-- Name: org_connection_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_connection_type AS ENUM (
    'current',
    'former',
    'connected_insider'
);


--
-- Name: post_media_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_media_type AS ENUM (
    'image',
    'video',
    'link'
);


--
-- Name: pricing_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pricing_tier AS ENUM (
    'free',
    'community',
    'pro',
    'partner'
);


--
-- Name: test_run_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_run_status AS ENUM (
    'success',
    'failure',
    'in_progress'
);


--
-- Name: test_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_status AS ENUM (
    'passed',
    'failed',
    'skipped'
);


--
-- Name: test_suite_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_suite_status AS ENUM (
    'success',
    'failure',
    'skipped',
    'in_progress'
);


--
-- Name: create_test_schema(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_test_schema(schema_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
DECLARE
  result jsonb;
BEGIN
  -- Validate schema name (must start with test_)
  IF schema_name !~ '^test_[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid test schema name. Must start with test_: %', schema_name;
  END IF;
  
  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  result := jsonb_build_object(
    'success', true,
    'schema_name', schema_name,
    'created_at', now()
  );
  
  RETURN result;
END;
$_$;


--
-- Name: drop_test_schema(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.drop_test_schema(schema_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
DECLARE
  result jsonb;
BEGIN
  -- Validate schema name (must start with test_)
  IF schema_name !~ '^test_[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid test schema name. Must start with test_: %', schema_name;
  END IF;
  
  -- Drop schema
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
  
  result := jsonb_build_object(
    'success', true,
    'schema_name', schema_name,
    'dropped_at', now()
  );
  
  RETURN result;
END;
$_$;


--
-- Name: enforce_tag_entity_types(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_tag_entity_types() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If a tag was just created and has no entity types, raise an exception
  IF NOT EXISTS (
    SELECT 1 FROM tag_entity_types 
    WHERE tag_id = NEW.id
  ) THEN
    -- Insert a default entity type instead of raising an exception
    -- This provides a safety net for any code that might not be updated yet
    INSERT INTO tag_entity_types (tag_id, entity_type)
    VALUES (NEW.id, 'person');
    
    RAISE NOTICE 'Automatically added default entity_type (person) to new tag %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: get_cached_tags(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_cached_tags(cache_key text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  cached_data JSONB;
  cache_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get cache data and time
  SELECT data, updated_at INTO cached_data, cache_time 
  FROM public.cache 
  WHERE key = cache_key;
  
  -- Return data only if cache exists and is less than 5 minutes old
  IF cached_data IS NOT NULL AND 
     (EXTRACT(EPOCH FROM (now() - cache_time)) < 300) THEN
    RETURN cached_data;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;


--
-- Name: get_table_info(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_table_info(p_schema text, p_table text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
DECLARE
  result jsonb;
  columns_info jsonb;
BEGIN
  -- Validate inputs
  IF p_schema !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' OR p_table !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid schema or table name';
  END IF;
  
  -- Get column information
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default,
      'ordinal_position', ordinal_position
    ) ORDER BY ordinal_position
  )
  INTO columns_info
  FROM information_schema.columns
  WHERE table_schema = p_schema AND table_name = p_table;
  
  result := jsonb_build_object(
    'schema_name', p_schema,
    'table_name', p_table,
    'columns', COALESCE(columns_info, '[]'::jsonb)
  );
  
  RETURN result;
END;
$_$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles (id, first_name, last_name, email, is_approved)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    true
  );
  return new;
end;
$$;


--
-- Name: is_site_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_site_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  RETURN (
    ((auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin') OR
    ((auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin')
  );
END;
$$;


--
-- Name: pg_get_tabledef(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pg_get_tabledef(p_schema text, p_table text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_table_ddl text;
    column_record record;
    table_rec record;
BEGIN
    -- Get the basic table structure
    SELECT 'CREATE TABLE ' || p_schema || '.' || p_table || ' (' INTO v_table_ddl;

    -- Get the table columns
    FOR column_record IN 
        SELECT 
            column_name, 
            data_type, 
            coalesce(character_maximum_length::text, '') as max_length,
            is_nullable,
            column_default
        FROM 
            information_schema.columns
        WHERE 
            table_schema = p_schema AND table_name = p_table
        ORDER BY 
            ordinal_position 
    LOOP
        v_table_ddl := v_table_ddl || E'\n  ' || column_record.column_name || ' ' || column_record.data_type;
        
        -- Add length if exists
        IF column_record.max_length <> '' THEN
            v_table_ddl := v_table_ddl || '(' || column_record.max_length || ')';
        END IF;
        
        -- Add nullable constraint
        IF column_record.is_nullable = 'NO' THEN
            v_table_ddl := v_table_ddl || ' NOT NULL';
        END IF;
        
        -- Add default if exists
        IF column_record.column_default IS NOT NULL THEN
            v_table_ddl := v_table_ddl || ' DEFAULT ' || column_record.column_default;
        END IF;
        
        -- Add column separator
        v_table_ddl := v_table_ddl || ',';
    END LOOP;

    -- Get primary key constraint
    FOR table_rec IN
        SELECT 
            kcu.column_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints tc
        JOIN 
            information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE 
            tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = p_schema
            AND tc.table_name = p_table
    LOOP
        v_table_ddl := v_table_ddl || E'\n  ' || 'CONSTRAINT ' || table_rec.constraint_name || ' PRIMARY KEY (' || table_rec.column_name || ')';
        -- No comma needed after primary key if it's the last constraint
    END LOOP;

    -- Remove trailing comma if any
    IF v_table_ddl LIKE '%,' THEN
        v_table_ddl := substr(v_table_ddl, 1, length(v_table_ddl) - 1);
    END IF;

    v_table_ddl := v_table_ddl || E'\n);';
    
    RETURN v_table_ddl;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: query_tags(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.query_tags(query_text text) RETURNS SETOF public.tags
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$;


--
-- Name: update_tag_cache(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tag_cache(cache_key text, cache_data jsonb) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  INSERT INTO public.cache (key, data, updated_at)
  VALUES (cache_key, cache_data, now())
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;
  
  RETURN TRUE;
END;
$$;


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_schema_structure(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_schema_structure(target_schema text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
DECLARE
  result jsonb;
  table_count integer;
  tables_info jsonb;
BEGIN
  -- Validate schema name to prevent injection
  IF target_schema !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid schema name: %', target_schema;
  END IF;
  
  -- Get table count
  EXECUTE format('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %L', target_schema)
  INTO table_count;
  
  -- Get tables information
  EXECUTE format('
    SELECT jsonb_agg(
      jsonb_build_object(
        ''table_name'', table_name,
        ''table_type'', table_type
      )
    )
    FROM information_schema.tables 
    WHERE table_schema = %L
  ', target_schema)
  INTO tables_info;
  
  result := jsonb_build_object(
    'schema_name', target_schema,
    'table_count', table_count,
    'tables', COALESCE(tables_info, '[]'::jsonb),
    'validated_at', now()
  );
  
  RETURN result;
END;
$_$;


--
-- Name: tag_entity_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_entity_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id uuid NOT NULL,
    entity_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: all_tags_with_entity_types_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_tags_with_entity_types_view AS
 SELECT t.id,
    t.name,
    t.description,
    t.created_at,
    t.created_by,
    t.updated_at,
    array_agg(tet.entity_type) AS entity_types
   FROM (public.tags t
     JOIN public.tag_entity_types tet ON ((t.id = tet.tag_id)))
  GROUP BY t.id, t.name, t.description, t.created_at, t.created_by, t.updated_at;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    channel_type public.chat_channel_type DEFAULT 'group'::public.chat_channel_type,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    description text
);

ALTER TABLE ONLY public.chat_channels REPLICA IDENTITY FULL;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    message text,
    created_at timestamp without time zone DEFAULT now(),
    channel_id uuid,
    parent_id uuid,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.chats REPLICA IDENTITY FULL;


--
-- Name: chat_reply_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.chat_reply_counts WITH (security_barrier='true', security_invoker='true') AS
 SELECT chats.parent_id,
    count(chats.id) AS count
   FROM public.chats
  WHERE (chats.parent_id IS NOT NULL)
  GROUP BY chats.parent_id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dm_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid,
    user_id uuid,
    joined_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tag_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id uuid,
    target_type text,
    target_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tag_assignments_target_type_check CHECK ((target_type = ANY (ARRAY['person'::text, 'organization'::text, 'event'::text, 'guide'::text, 'chat'::text, 'hub'::text, 'post'::text])))
);


--
-- Name: entity_tag_assignments_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.entity_tag_assignments_view AS
 SELECT ta.id,
    ta.tag_id,
    ta.target_type,
    ta.target_id,
    ta.created_at,
    ta.updated_at,
    t.name AS tag_name,
    t.description AS tag_description,
    t.created_by AS tag_created_by,
    ( SELECT array_agg(tet.entity_type) AS array_agg
           FROM public.tag_entity_types tet
          WHERE (tet.tag_id = ta.tag_id)) AS entity_types
   FROM (public.tag_assignments ta
     JOIN public.tags t ON ((ta.tag_id = t.id)));


--
-- Name: event_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE event_registrations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_registrations IS 'Tracks user registrations for events';


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    description text,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    location_id uuid,
    tag_id uuid,
    host_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_paid boolean DEFAULT false,
    price numeric,
    is_virtual boolean DEFAULT false
);


--
-- Name: events_with_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.events_with_tags AS
 SELECT e.id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location_id,
    e.tag_id,
    e.host_id,
    e.created_at,
    e.updated_at,
    e.is_paid,
    e.price,
    e.is_virtual,
    ta.id AS assigned_tag_id,
    t.name AS tag_name
   FROM ((public.events e
     LEFT JOIN public.tag_assignments ta ON (((e.id = ta.target_id) AND (ta.target_type = 'event'::text))))
     LEFT JOIN public.tags t ON ((ta.tag_id = t.id)))
  WHERE ((EXISTS ( SELECT 1
           FROM public.tag_entity_types tet
          WHERE ((tet.tag_id = t.id) AND (tet.entity_type = 'event'::text)))) OR (t.id IS NULL));


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    key text NOT NULL,
    enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: filtered_entity_tags_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.filtered_entity_tags_view AS
 SELECT t.id,
    t.name,
    t.description,
    t.created_at,
    t.created_by,
    t.updated_at,
    tet.entity_type
   FROM (public.tags t
     JOIN public.tag_entity_types tet ON ((t.id = tet.tag_id)));


--
-- Name: guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text,
    author_id uuid,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hubs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id uuid,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    name text DEFAULT ''::text NOT NULL
);


--
-- Name: hub_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.hub_details WITH (security_barrier='true', security_invoker='true') AS
 SELECT h.id,
    h.name,
    h.description,
    h.is_featured,
    h.created_at,
    h.updated_at,
    h.tag_id,
    t.name AS tag_name,
    t.description AS tag_description
   FROM (public.hubs h
     LEFT JOIN public.tags t ON ((h.tag_id = t.id)));


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    city text,
    region text,
    country text,
    full_name text GENERATED ALWAYS AS (((COALESCE((city || ', '::text), ''::text) || COALESCE((region || ', '::text), ''::text)) || country)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    latitude numeric(10,7),
    longitude numeric(10,7),
    admin_code1 character varying(20),
    admin_code2 character varying(80),
    admin_name2 character varying(100),
    geoname_id integer,
    timezone character varying(40),
    full_region_path text,
    population integer
);


--
-- Name: org_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    organization_id uuid,
    connection_type public.org_connection_type,
    department text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: organization_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    organization_id uuid,
    role text DEFAULT 'owner'::text,
    can_edit_profile boolean DEFAULT true,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT organization_admins_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text])))
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    website_url text,
    logo_url text,
    logo_api_url text,
    location_id uuid,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: organizations_with_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.organizations_with_tags AS
 SELECT o.id,
    o.name,
    o.description,
    o.website_url,
    o.logo_url,
    o.logo_api_url,
    o.location_id,
    o.is_verified,
    o.created_at,
    o.updated_at,
    ta.id AS assigned_tag_id,
    t.name AS tag_name
   FROM ((public.organizations o
     LEFT JOIN public.tag_assignments ta ON (((o.id = ta.target_id) AND (ta.target_type = 'organization'::text))))
     LEFT JOIN public.tags t ON ((ta.tag_id = t.id)))
  WHERE ((EXISTS ( SELECT 1
           FROM public.tag_entity_types tet
          WHERE ((tet.tag_id = t.id) AND (tet.entity_type = 'organization'::text)))) OR (t.id IS NULL));


--
-- Name: orphaned_tags_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.orphaned_tags_view AS
 SELECT t.id,
    t.name,
    t.description,
    t.created_by,
    t.created_at,
    t.updated_at,
    ARRAY[]::text[] AS entity_types
   FROM public.tags t
  WHERE (NOT (EXISTS ( SELECT 1
           FROM public.tag_entity_types tet
          WHERE (tet.tag_id = t.id))));


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text,
    last_name text,
    headline text,
    bio text,
    avatar_url text,
    linkedin_url text,
    twitter_url text,
    website_url text,
    company text,
    email text,
    location_id uuid,
    membership_tier public.pricing_tier DEFAULT 'free'::public.pricing_tier,
    is_approved boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    timezone text DEFAULT 'UTC'::text
);


--
-- Name: people_with_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.people_with_tags AS
 SELECT p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.headline,
    p.bio,
    p.avatar_url,
    p.linkedin_url,
    p.twitter_url,
    p.website_url,
    p.location_id,
    p.company,
    p.timezone,
    p.created_at,
    p.updated_at,
    p.is_approved,
    p.membership_tier,
    ta.id AS assigned_tag_id,
    t.name AS tag_name
   FROM ((public.profiles p
     LEFT JOIN public.tag_assignments ta ON (((p.id = ta.target_id) AND (ta.target_type = 'person'::text))))
     LEFT JOIN public.tags t ON ((ta.tag_id = t.id)))
  WHERE ((EXISTS ( SELECT 1
           FROM public.tag_entity_types tet
          WHERE ((tet.tag_id = t.id) AND (tet.entity_type = 'person'::text)))) OR (t.id IS NULL));


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    media_type public.post_media_type NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    has_media boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tag_entity_types_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.tag_entity_types_view AS
SELECT
    NULL::uuid AS id,
    NULL::text AS name,
    NULL::text AS description,
    NULL::uuid AS created_by,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::text[] AS entity_types;


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_run_id uuid NOT NULL,
    test_suite text NOT NULL,
    test_name text NOT NULL,
    status public.test_status NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    error_message text,
    stack_trace text,
    console_output text,
    created_at timestamp with time zone DEFAULT now(),
    test_suite_id uuid
);


--
-- Name: test_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    run_at timestamp with time zone DEFAULT now(),
    total_tests integer DEFAULT 0 NOT NULL,
    passed_tests integer DEFAULT 0 NOT NULL,
    failed_tests integer DEFAULT 0 NOT NULL,
    skipped_tests integer DEFAULT 0 NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    git_commit text,
    git_branch text,
    status public.test_run_status DEFAULT 'in_progress'::public.test_run_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_suites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_suites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_run_id uuid NOT NULL,
    suite_name text NOT NULL,
    file_path text NOT NULL,
    status public.test_suite_status NOT NULL,
    error_message text,
    test_count integer DEFAULT 0 NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: chat_channels chat_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: dm_participants dm_participants_channel_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_participants
    ADD CONSTRAINT dm_participants_channel_id_user_id_key UNIQUE (channel_id, user_id);


--
-- Name: dm_participants dm_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_participants
    ADD CONSTRAINT dm_participants_pkey PRIMARY KEY (id);


--
-- Name: event_participants event_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (key);


--
-- Name: guides guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guides
    ADD CONSTRAINT guides_pkey PRIMARY KEY (id);


--
-- Name: guides guides_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guides
    ADD CONSTRAINT guides_slug_key UNIQUE (slug);


--
-- Name: hubs hubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hubs
    ADD CONSTRAINT hubs_pkey PRIMARY KEY (id);


--
-- Name: locations locations_geoname_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_geoname_id_unique UNIQUE (geoname_id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: org_relationships org_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_relationships
    ADD CONSTRAINT org_relationships_pkey PRIMARY KEY (id);


--
-- Name: organization_admins organization_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_admins
    ADD CONSTRAINT organization_admins_pkey PRIMARY KEY (id);


--
-- Name: organization_admins organization_admins_profile_id_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_admins
    ADD CONSTRAINT organization_admins_profile_id_organization_id_key UNIQUE (profile_id, organization_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tag_assignments tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_pkey PRIMARY KEY (id);


--
-- Name: tag_entity_types tag_entity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_entity_types
    ADD CONSTRAINT tag_entity_types_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: test_runs test_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_pkey PRIMARY KEY (id);


--
-- Name: test_suites test_suites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_pkey PRIMARY KEY (id);


--
-- Name: event_registrations unique_event_registration; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT unique_event_registration UNIQUE (event_id, profile_id);


--
-- Name: idx_event_registrations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event_id ON public.event_registrations USING btree (event_id);


--
-- Name: idx_event_registrations_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_profile_id ON public.event_registrations USING btree (profile_id);


--
-- Name: idx_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_assignments_tag_id ON public.tag_assignments USING btree (tag_id);


--
-- Name: idx_tag_assignments_target_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_assignments_target_composite ON public.tag_assignments USING btree (target_type, target_id);


--
-- Name: idx_tag_assignments_target_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_assignments_target_type ON public.tag_assignments USING btree (target_type);


--
-- Name: idx_tag_entity_types_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_entity_types_entity_type ON public.tag_entity_types USING btree (entity_type);


--
-- Name: idx_tag_entity_types_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_entity_types_tag_id ON public.tag_entity_types USING btree (tag_id);


--
-- Name: idx_test_results_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_status ON public.test_results USING btree (status);


--
-- Name: idx_test_results_test_run_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_test_run_id ON public.test_results USING btree (test_run_id);


--
-- Name: idx_test_results_test_suite_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_test_suite_id ON public.test_results USING btree (test_suite_id);


--
-- Name: idx_test_runs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_runs_status ON public.test_runs USING btree (status);


--
-- Name: idx_test_suites_test_run_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_suites_test_run_id ON public.test_suites USING btree (test_run_id);


--
-- Name: locations_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_search_idx ON public.locations USING btree (city, region, country);


--
-- Name: tag_entity_types_entity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_entity_types_entity_type_idx ON public.tag_entity_types USING btree (entity_type);


--
-- Name: tag_entity_types_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tag_entity_types_unique_idx ON public.tag_entity_types USING btree (tag_id, entity_type);


--
-- Name: tag_entity_types_view _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.tag_entity_types_view AS
 SELECT t.id,
    t.name,
    t.description,
    t.created_by,
    t.created_at,
    t.updated_at,
    array_agg(tet.entity_type) AS entity_types
   FROM (public.tags t
     JOIN public.tag_entity_types tet ON ((t.id = tet.tag_id)))
  GROUP BY t.id;


--
-- Name: tags ensure_tag_has_entity_types; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_tag_has_entity_types AFTER INSERT ON public.tags FOR EACH ROW EXECUTE FUNCTION public.enforce_tag_entity_types();


--
-- Name: post_comments post_comments_update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER post_comments_update_timestamp BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: post_media post_media_update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER post_media_update_timestamp BEFORE UPDATE ON public.post_media FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: posts posts_update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_update_timestamp BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: chat_channels set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chat_channels FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: chats set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: dm_participants set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.dm_participants FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: event_participants set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: events set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: feature_flags set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: guides set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.guides FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: hubs set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hubs FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: locations set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: org_relationships set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.org_relationships FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: organization_admins set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organization_admins FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: organizations set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: tag_assignments set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tag_assignments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: tags set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: tag_entity_types update_tag_entity_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tag_entity_types_updated_at BEFORE UPDATE ON public.tag_entity_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_channels chat_channels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: chats chats_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id) ON DELETE CASCADE;


--
-- Name: chats chats_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: chats chats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dm_participants dm_participants_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_participants
    ADD CONSTRAINT dm_participants_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id) ON DELETE CASCADE;


--
-- Name: dm_participants dm_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_participants
    ADD CONSTRAINT dm_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: event_participants event_participants_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_participants event_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: events events_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id);


--
-- Name: events events_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: events events_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: guides guides_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guides
    ADD CONSTRAINT guides_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: hubs hubs_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hubs
    ADD CONSTRAINT hubs_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: org_relationships org_relationships_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_relationships
    ADD CONSTRAINT org_relationships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: org_relationships org_relationships_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_relationships
    ADD CONSTRAINT org_relationships_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: organization_admins organization_admins_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_admins
    ADD CONSTRAINT organization_admins_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_admins organization_admins_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_admins
    ADD CONSTRAINT organization_admins_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: post_comments post_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: post_media post_media_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: tag_assignments tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_assignments
    ADD CONSTRAINT tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: tag_entity_types tag_entity_types_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_entity_types
    ADD CONSTRAINT tag_entity_types_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: test_results test_results_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_test_suite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_test_suite_id_fkey FOREIGN KEY (test_suite_id) REFERENCES public.test_suites(id) ON DELETE SET NULL;


--
-- Name: test_suites test_suites_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- Name: test_results Admins can manage test_results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage test_results" ON public.test_results TO authenticated USING (((auth.jwt() ->> 'app_metadata'::text) = ('{"role": "admin"}'::jsonb)::text));


--
-- Name: test_runs Admins can manage test_runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage test_runs" ON public.test_runs TO authenticated USING (((auth.jwt() ->> 'app_metadata'::text) = ('{"role": "admin"}'::jsonb)::text));


--
-- Name: hubs Admins can modify hubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can modify hubs" ON public.hubs USING (( SELECT ((auth.jwt() ->> 'role'::text) = 'admin'::text)));


--
-- Name: cache Allow authenticated users to insert cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to insert cache" ON public.cache FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cache Allow authenticated users to read cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read cache" ON public.cache FOR SELECT TO authenticated USING (true);


--
-- Name: cache Allow authenticated users to update cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to update cache" ON public.cache FOR UPDATE TO authenticated USING (true);


--
-- Name: test_results Allow inserting test results for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow inserting test results for authenticated users" ON public.test_results FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: test_runs Allow inserting test runs for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow inserting test runs for authenticated users" ON public.test_runs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: test_runs Allow updating test runs for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow updating test runs for authenticated users" ON public.test_runs FOR UPDATE TO authenticated USING (true);


--
-- Name: test_results Allow viewing test results for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow viewing test results for authenticated users" ON public.test_results FOR SELECT TO authenticated USING (true);


--
-- Name: test_runs Allow viewing test runs for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow viewing test runs for authenticated users" ON public.test_runs FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Anyone can view approved profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved profiles" ON public.profiles FOR SELECT USING ((is_approved = true));


--
-- Name: comment_likes Anyone can view comment likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);


--
-- Name: post_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);


--
-- Name: hubs Anyone can view hubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view hubs" ON public.hubs FOR SELECT USING (true);


--
-- Name: locations Anyone can view locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);


--
-- Name: chats Anyone can view messages in public channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view messages in public channels" ON public.chats FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_channels
  WHERE ((chat_channels.id = chats.channel_id) AND (chat_channels.is_public = true)))));


--
-- Name: organization_admins Anyone can view organization admin status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view organization admin status" ON public.organization_admins FOR SELECT USING (true);


--
-- Name: organizations Anyone can view organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view organizations" ON public.organizations FOR SELECT USING (true);


--
-- Name: post_likes Anyone can view post likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view post likes" ON public.post_likes FOR SELECT USING (true);


--
-- Name: tag_assignments Anyone can view tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tag assignments" ON public.tag_assignments FOR SELECT USING (true);


--
-- Name: tag_entity_types Anyone can view tag entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tag entity types" ON public.tag_entity_types FOR SELECT USING (true);


--
-- Name: tags Anyone can view tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);


--
-- Name: chat_channels Authenticated users can create channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create channels" ON public.chat_channels FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: chat_channels Authenticated users can view public channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view public channels" ON public.chat_channels FOR SELECT USING ((is_public = true));


--
-- Name: tag_assignments Authors can assign tags to their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can assign tags to their own posts" ON public.tag_assignments FOR INSERT WITH CHECK (((target_type = 'post'::text) AND (EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = tag_assignments.target_id) AND (posts.author_id = auth.uid()))))));


--
-- Name: tag_assignments Authors can remove tags from their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can remove tags from their own posts" ON public.tag_assignments FOR DELETE USING (((target_type = 'post'::text) AND (EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = tag_assignments.target_id) AND (posts.author_id = auth.uid()))))));


--
-- Name: tag_entity_types Enable all operations for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for authenticated users" ON public.tag_entity_types TO authenticated USING (true);


--
-- Name: tag_entity_types Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.tag_entity_types FOR SELECT TO anon USING (true);


--
-- Name: tag_assignments Event hosts can assign tags to their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can assign tags to their events" ON public.tag_assignments FOR INSERT WITH CHECK (((target_type = 'event'::text) AND (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tag_assignments.target_id) AND (events.host_id = auth.uid()))))));


--
-- Name: tag_assignments Event hosts can manage event tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can manage event tags" ON public.tag_assignments USING (((target_type = 'event'::text) AND (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tag_assignments.target_id) AND (events.host_id = auth.uid())))))) WITH CHECK (((target_type = 'event'::text) AND (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tag_assignments.target_id) AND (events.host_id = auth.uid()))))));


--
-- Name: tag_assignments Event hosts can remove tags from their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can remove tags from their events" ON public.tag_assignments FOR DELETE USING (((target_type = 'event'::text) AND (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tag_assignments.target_id) AND (events.host_id = auth.uid()))))));


--
-- Name: tag_assignments Event hosts can update tags on their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event hosts can update tags on their events" ON public.tag_assignments FOR UPDATE USING (((target_type = 'event'::text) AND (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = tag_assignments.target_id) AND (events.host_id = auth.uid()))))));


--
-- Name: post_comments Everyone can read comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read comments" ON public.post_comments FOR SELECT USING (true);


--
-- Name: posts Everyone can read posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read posts" ON public.posts FOR SELECT USING (true);


--
-- Name: post_media Everyone can view post media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view post media" ON public.post_media FOR SELECT USING (true);


--
-- Name: tag_assignments Everyone can view tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view tag assignments" ON public.tag_assignments FOR SELECT USING (true);


--
-- Name: tag_assignments Organization admins can assign tags to their organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can assign tags to their organizations" ON public.tag_assignments FOR INSERT TO authenticated WITH CHECK (((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.profile_id = auth.uid()) AND (organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.is_approved = true))))));


--
-- Name: tags Organization admins can create tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: tag_assignments Organization admins can manage organization tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can manage organization tags" ON public.tag_assignments USING (((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.profile_id = auth.uid()) AND (organization_admins.is_approved = true)))))) WITH CHECK (((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.profile_id = auth.uid()) AND (organization_admins.is_approved = true))))));


--
-- Name: tag_assignments Organization admins can remove tag assignments from their organ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can remove tag assignments from their organ" ON public.tag_assignments FOR DELETE TO authenticated USING (((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.profile_id = auth.uid()) AND (organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.is_approved = true))))));


--
-- Name: organizations Organization admins can update organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can update organizations" ON public.organizations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.organization_id = organizations.id) AND (organization_admins.profile_id = auth.uid()) AND (organization_admins.is_approved = true)))));


--
-- Name: tags Organization admins can view all tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can view all tags" ON public.tags FOR SELECT TO authenticated USING (true);


--
-- Name: tag_assignments Organization admins can view tag assignments for their organiza; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization admins can view tag assignments for their organiza" ON public.tag_assignments FOR SELECT TO authenticated USING (((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.profile_id = auth.uid()) AND (organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.is_approved = true))))));


--
-- Name: organization_admins Organization owners can update admin status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization owners can update admin status" ON public.organization_admins FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.organization_admins organization_admins_1
  WHERE ((organization_admins_1.organization_id = organization_admins_1.organization_id) AND (organization_admins_1.profile_id = auth.uid()) AND (organization_admins_1.role = 'owner'::text) AND (organization_admins_1.is_approved = true)))));


--
-- Name: post_comments Post owners can delete any comments on their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Post owners can delete any comments on their posts" ON public.post_comments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_comments.post_id) AND (posts.author_id = auth.uid())))));


--
-- Name: tag_assignments Profile owners can manage their profile tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profile owners can manage their profile tags" ON public.tag_assignments USING (((target_type = 'person'::text) AND (auth.uid() = target_id))) WITH CHECK (((target_type = 'person'::text) AND (auth.uid() = target_id)));


--
-- Name: test_results Public can view test_results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view test_results" ON public.test_results FOR SELECT TO anon USING (true);


--
-- Name: test_runs Public can view test_runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view test_runs" ON public.test_runs FOR SELECT TO anon USING (true);


--
-- Name: profiles Read public profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read public profiles" ON public.profiles FOR SELECT USING (((is_approved = true) OR (auth.uid() = id)));


--
-- Name: test_results Service role can access test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access test results" ON public.test_results USING (true);


--
-- Name: test_runs Service role can access test runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access test runs" ON public.test_runs USING (true);


--
-- Name: test_suites Service role can access test suites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access test suites" ON public.test_suites USING (true);


--
-- Name: tag_assignments Site admins can manage chat channel tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site admins can manage chat channel tags" ON public.tag_assignments USING (((target_type = 'chat'::text) AND public.is_site_admin())) WITH CHECK (((target_type = 'chat'::text) AND public.is_site_admin()));


--
-- Name: tag_assignments Site admins can manage hub tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site admins can manage hub tags" ON public.tag_assignments USING (((target_type = 'hub'::text) AND public.is_site_admin())) WITH CHECK (((target_type = 'hub'::text) AND public.is_site_admin()));


--
-- Name: tag_assignments Tag creators can manage tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tag creators can manage tag assignments" ON public.tag_assignments USING ((EXISTS ( SELECT 1
   FROM public.tags
  WHERE ((tags.id = tag_assignments.tag_id) AND (tags.created_by = auth.uid())))));


--
-- Name: tag_entity_types Users can add entity types to tags they create; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add entity types to tags they create" ON public.tag_entity_types FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tags
  WHERE ((tags.id = tag_entity_types.tag_id) AND (tags.created_by = auth.uid())))));


--
-- Name: tag_assignments Users can assign tags to their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can assign tags to their own profile" ON public.tag_assignments FOR INSERT WITH CHECK (((auth.uid() = target_id) AND (target_type = 'person'::text)));


--
-- Name: post_comments Users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: organizations Users can create organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (true);


--
-- Name: tags Users can create tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tags" ON public.tags FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: post_comments Users can create their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own comments" ON public.post_comments FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: events Users can create their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK ((auth.uid() = host_id));


--
-- Name: posts Users can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: tag_entity_types Users can delete entity types from tags they create; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete entity types from tags they create" ON public.tag_entity_types FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.tags
  WHERE ((tags.id = tag_entity_types.tag_id) AND (tags.created_by = auth.uid())))));


--
-- Name: post_media Users can delete media for their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete media for their own posts" ON public.post_media FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_media.post_id) AND (posts.author_id = auth.uid())))));


--
-- Name: org_relationships Users can delete own relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own relationships" ON public.org_relationships FOR DELETE USING ((profile_id = auth.uid()));


--
-- Name: tag_assignments Users can delete tags from their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete tags from their own profile" ON public.tag_assignments FOR DELETE USING (((target_id = auth.uid()) AND (target_type = 'person'::text)));


--
-- Name: post_comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: events Users can delete their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING ((auth.uid() = host_id));


--
-- Name: chats Users can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own messages" ON public.chats FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: event_registrations Users can delete their own registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own registrations" ON public.event_registrations FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: post_media Users can insert media for their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert media for their own posts" ON public.post_media FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_media.post_id) AND (posts.author_id = auth.uid())))));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: org_relationships Users can insert own relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own relationships" ON public.org_relationships FOR INSERT WITH CHECK ((profile_id = auth.uid()));


--
-- Name: chats Users can insert their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own messages" ON public.chats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: comment_likes Users can like comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_likes Users can like posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_channels Users can manage channels they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage channels they created" ON public.chat_channels USING ((auth.uid() = created_by));


--
-- Name: tag_assignments Users can manage tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage tag assignments" ON public.tag_assignments USING ((((target_type = 'profile'::text) AND (target_id = auth.uid())) OR ((target_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM public.organization_admins
  WHERE ((organization_admins.organization_id = tag_assignments.target_id) AND (organization_admins.profile_id = auth.uid()) AND (organization_admins.is_approved = true)))))));


--
-- Name: event_registrations Users can register themselves for events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can register themselves for events" ON public.event_registrations FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: organization_admins Users can request admin status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can request admin status" ON public.organization_admins FOR INSERT WITH CHECK ((profile_id = auth.uid()));


--
-- Name: comment_likes Users can unlike comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_likes Users can unlike posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tag_entity_types Users can update entity types for tags they create; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update entity types for tags they create" ON public.tag_entity_types FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.tags
  WHERE ((tags.id = tag_entity_types.tag_id) AND (tags.created_by = auth.uid())))));


--
-- Name: post_media Users can update media for their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update media for their own posts" ON public.post_media FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_media.post_id) AND (posts.author_id = auth.uid())))));


--
-- Name: profiles Users can update own profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: org_relationships Users can update own relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own relationships" ON public.org_relationships FOR UPDATE USING ((profile_id = auth.uid()));


--
-- Name: post_comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.post_comments FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: events Users can update their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING ((auth.uid() = host_id));


--
-- Name: chats Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.chats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: events Users can view all events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all events" ON public.events FOR SELECT USING (true);


--
-- Name: profiles Users can view and edit their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view and edit their own profile" ON public.profiles USING ((auth.uid() = id));


--
-- Name: chat_channels Users can view channels they participate in; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view channels they participate in" ON public.chat_channels FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.dm_participants
  WHERE ((dm_participants.channel_id = dm_participants.id) AND (dm_participants.user_id = auth.uid())))));


--
-- Name: org_relationships Users can view relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view relationships" ON public.org_relationships FOR SELECT USING (true);


--
-- Name: tag_assignments Users can view tags assigned to their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tags assigned to their own profile" ON public.tag_assignments FOR SELECT USING ((((target_id = auth.uid()) AND (target_type = 'person'::text)) OR (target_type = 'organization'::text)));


--
-- Name: event_registrations Users can view their own registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own registrations" ON public.event_registrations FOR SELECT USING (((auth.uid() = profile_id) OR (EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_registrations.event_id) AND (events.host_id = auth.uid()))))));


--
-- Name: organization_admins Users can withdraw admin requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can withdraw admin requests" ON public.organization_admins FOR DELETE USING ((profile_id = auth.uid()));


--
-- Name: cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: chats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

--
-- Name: comment_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: event_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: guides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

--
-- Name: hubs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

--
-- Name: locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: org_relationships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: post_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tag_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: tag_entity_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag_entity_types ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: test_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

--
-- Name: test_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: test_suites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

