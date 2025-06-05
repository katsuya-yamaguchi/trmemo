--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: body_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.body_stats (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    weight numeric(5,2) NOT NULL,
    body_fat_percentage numeric(4,2),
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.body_stats OWNER TO postgres;

--
-- Name: TABLE body_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.body_stats IS 'ユーザーの体重と体組成の記録';


--
-- Name: COLUMN body_stats.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.body_stats.user_id IS '記録したユーザーのID (users.id への外部キー)';


--
-- Name: COLUMN body_stats.weight; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.body_stats.weight IS '記録された体重 (kg)';


--
-- Name: COLUMN body_stats.body_fat_percentage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.body_stats.body_fat_percentage IS '記録された体脂肪率 (%)';


--
-- Name: COLUMN body_stats.recorded_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.body_stats.recorded_at IS 'データが記録された日時';


--
-- Name: COLUMN body_stats.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.body_stats.created_at IS 'レコードが作成された日時';


--
-- Name: body_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.body_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.body_stats_id_seq OWNER TO postgres;

--
-- Name: body_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.body_stats_id_seq OWNED BY public.body_stats.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercises (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    muscle_group text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    type character varying(50) DEFAULT 'other'::character varying NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    target_muscles text[] DEFAULT '{}'::text[] NOT NULL,
    difficulty character varying(20) DEFAULT 'beginner'::character varying NOT NULL,
    equipment text[] DEFAULT '{}'::text[] NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT exercises_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT exercises_type_check CHECK (((type)::text = ANY ((ARRAY['barbell'::character varying, 'dumbbell'::character varying, 'band'::character varying, 'machine'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.exercises OWNER TO postgres;

--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legal_documents (
    id uuid NOT NULL,
    document_type text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_latest boolean DEFAULT true NOT NULL
);


ALTER TABLE public.legal_documents OWNER TO postgres;

--
-- Name: media_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_uploads (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    media_type character varying(50),
    file_url character varying(255),
    caption text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.media_uploads OWNER TO postgres;

--
-- Name: media_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_uploads_id_seq OWNER TO postgres;

--
-- Name: media_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_uploads_id_seq OWNED BY public.media_uploads.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    notification_type character varying(50),
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: session_exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_exercises (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    exercise_name character varying(100) NOT NULL,
    weight numeric(10,2),
    reps integer,
    rest_time integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.session_exercises OWNER TO postgres;

--
-- Name: session_exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_exercises_id_seq OWNER TO postgres;

--
-- Name: session_exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_exercises_id_seq OWNED BY public.session_exercises.id;


--
-- Name: session_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_shares (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    platform character varying(50),
    share_status character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.session_shares OWNER TO postgres;

--
-- Name: session_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_shares_id_seq OWNER TO postgres;

--
-- Name: session_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_shares_id_seq OWNED BY public.session_shares.id;


--
-- Name: session_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_summaries (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    summary_text text,
    avg_heart_rate integer,
    max_heart_rate integer,
    total_calories numeric(10,2),
    feedback text,
    created_at timestamp with time zone DEFAULT now(),
    total_distinct_exercises integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.session_summaries OWNER TO postgres;

--
-- Name: COLUMN session_summaries.total_distinct_exercises; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_summaries.total_distinct_exercises IS 'セッション内で行われたユニークな種目の総数';


--
-- Name: session_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_summaries_id_seq OWNER TO postgres;

--
-- Name: session_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_summaries_id_seq OWNED BY public.session_summaries.id;


--
-- Name: session_to_training_day_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_to_training_day_links (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    user_training_day_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.session_to_training_day_links OWNER TO postgres;

--
-- Name: TABLE session_to_training_day_links; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.session_to_training_day_links IS 'トレーニングセッションと特定のトレーニング日を紐付ける中間テーブル';


--
-- Name: COLUMN session_to_training_day_links.session_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_to_training_day_links.session_id IS 'セッションのID (sessions.id への外部キー)';


--
-- Name: COLUMN session_to_training_day_links.user_training_day_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_to_training_day_links.user_training_day_id IS 'ユーザートレーニング日のID (user_training_days.id への外部キー)';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration interval,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: training_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_plans (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    plan_text text,
    valid_from date,
    valid_to date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.training_plans OWNER TO postgres;

--
-- Name: training_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.training_plans_id_seq OWNER TO postgres;

--
-- Name: training_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_plans_id_seq OWNED BY public.training_plans.id;


--
-- Name: user_day_exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_day_exercises (
    id uuid NOT NULL,
    user_training_day_id uuid,
    exercise_id uuid,
    set_count integer,
    rep_min integer,
    rep_max integer,
    created_at timestamp without time zone DEFAULT now(),
    default_weight character varying(50),
    reps character varying(50) DEFAULT '0'::character varying NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.user_day_exercises OWNER TO postgres;

--
-- Name: user_exercise_sets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_exercise_sets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    session_id uuid,
    exercise_id uuid,
    set_number integer,
    weight numeric,
    reps integer,
    completed_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.user_exercise_sets OWNER TO postgres;

--
-- Name: user_training_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_training_days (
    id uuid NOT NULL,
    user_training_plan_id uuid,
    day_number integer,
    title text,
    estimated_duration integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.user_training_days OWNER TO postgres;

--
-- Name: user_training_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_training_plans (
    id uuid NOT NULL,
    user_id uuid,
    name text,
    base_plan_id integer NOT NULL,
    start_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.user_training_plans OWNER TO postgres;

--
-- Name: user_training_plans_base_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_training_plans_base_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_training_plans_base_plan_id_seq OWNER TO postgres;

--
-- Name: user_training_plans_base_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_training_plans_base_plan_id_seq OWNED BY public.user_training_plans.base_plan_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    name character varying(100),
    profile_image_url character varying(255),
    two_factor_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: voice_memos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voice_memos (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    transcript text,
    audio_file_url character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.voice_memos OWNER TO postgres;

--
-- Name: voice_memos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.voice_memos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.voice_memos_id_seq OWNER TO postgres;

--
-- Name: voice_memos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.voice_memos_id_seq OWNED BY public.voice_memos.id;


--
-- Name: wearable_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wearable_data (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    sensor_type character varying(50) NOT NULL,
    value numeric(10,2),
    recorded_at timestamp with time zone NOT NULL
);


ALTER TABLE public.wearable_data OWNER TO postgres;

--
-- Name: wearable_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wearable_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wearable_data_id_seq OWNER TO postgres;

--
-- Name: wearable_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wearable_data_id_seq OWNED BY public.wearable_data.id;


--
-- Name: body_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.body_stats ALTER COLUMN id SET DEFAULT nextval('public.body_stats_id_seq'::regclass);


--
-- Name: media_uploads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_uploads ALTER COLUMN id SET DEFAULT nextval('public.media_uploads_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: session_exercises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_exercises ALTER COLUMN id SET DEFAULT nextval('public.session_exercises_id_seq'::regclass);


--
-- Name: session_shares id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_shares ALTER COLUMN id SET DEFAULT nextval('public.session_shares_id_seq'::regclass);


--
-- Name: session_summaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_summaries ALTER COLUMN id SET DEFAULT nextval('public.session_summaries_id_seq'::regclass);


--
-- Name: training_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_plans ALTER COLUMN id SET DEFAULT nextval('public.training_plans_id_seq'::regclass);


--
-- Name: user_training_plans base_plan_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_plans ALTER COLUMN base_plan_id SET DEFAULT nextval('public.user_training_plans_base_plan_id_seq'::regclass);


--
-- Name: voice_memos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_memos ALTER COLUMN id SET DEFAULT nextval('public.voice_memos_id_seq'::regclass);


--
-- Name: wearable_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wearable_data ALTER COLUMN id SET DEFAULT nextval('public.wearable_data_id_seq'::regclass);


--
-- Name: body_stats body_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.body_stats
    ADD CONSTRAINT body_stats_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: media_uploads media_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_uploads
    ADD CONSTRAINT media_uploads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: session_exercises session_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_exercises
    ADD CONSTRAINT session_exercises_pkey PRIMARY KEY (id);


--
-- Name: session_shares session_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_shares
    ADD CONSTRAINT session_shares_pkey PRIMARY KEY (id);


--
-- Name: session_summaries session_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_summaries
    ADD CONSTRAINT session_summaries_pkey PRIMARY KEY (id);


--
-- Name: session_to_training_day_links session_to_training_day_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_to_training_day_links
    ADD CONSTRAINT session_to_training_day_links_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: training_plans training_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_pkey PRIMARY KEY (id);


--
-- Name: body_stats unique_user_recorded_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.body_stats
    ADD CONSTRAINT unique_user_recorded_date UNIQUE (user_id, recorded_at);


--
-- Name: session_to_training_day_links uq_session_training_day; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_to_training_day_links
    ADD CONSTRAINT uq_session_training_day UNIQUE (session_id, user_training_day_id);


--
-- Name: user_day_exercises user_day_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_day_exercises
    ADD CONSTRAINT user_day_exercises_pkey PRIMARY KEY (id);


--
-- Name: user_exercise_sets user_exercise_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_sets
    ADD CONSTRAINT user_exercise_sets_pkey PRIMARY KEY (id);


--
-- Name: user_training_days user_training_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_days
    ADD CONSTRAINT user_training_days_pkey PRIMARY KEY (id);


--
-- Name: user_training_plans user_training_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_plans
    ADD CONSTRAINT user_training_plans_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voice_memos voice_memos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_memos
    ADD CONSTRAINT voice_memos_pkey PRIMARY KEY (id);


--
-- Name: wearable_data wearable_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wearable_data
    ADD CONSTRAINT wearable_data_pkey PRIMARY KEY (id);


--
-- Name: idx_body_stats_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_body_stats_recorded_at ON public.body_stats USING btree (recorded_at DESC);


--
-- Name: idx_body_stats_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_body_stats_updated_at ON public.body_stats USING btree (updated_at);


--
-- Name: idx_body_stats_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_body_stats_user_id ON public.body_stats USING btree (user_id);


--
-- Name: idx_body_stats_user_id_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_body_stats_user_id_recorded_at ON public.body_stats USING btree (user_id, recorded_at DESC);


--
-- Name: idx_body_stats_user_recorded; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_body_stats_user_recorded ON public.body_stats USING btree (user_id, recorded_at DESC);


--
-- Name: idx_session_links_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_links_session_id ON public.session_to_training_day_links USING btree (session_id);


--
-- Name: idx_session_links_user_training_day_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_links_user_training_day_id ON public.session_to_training_day_links USING btree (user_training_day_id);


--
-- Name: body_stats body_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.body_stats
    ADD CONSTRAINT body_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: media_uploads media_uploads_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_uploads
    ADD CONSTRAINT media_uploads_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: media_uploads media_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_uploads
    ADD CONSTRAINT media_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_exercises session_exercises_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_exercises
    ADD CONSTRAINT session_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_shares session_shares_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_shares
    ADD CONSTRAINT session_shares_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_shares session_shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_shares
    ADD CONSTRAINT session_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_summaries session_summaries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_summaries
    ADD CONSTRAINT session_summaries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_summaries session_summaries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_summaries
    ADD CONSTRAINT session_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_to_training_day_links session_to_training_day_links_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_to_training_day_links
    ADD CONSTRAINT session_to_training_day_links_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_to_training_day_links session_to_training_day_links_user_training_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_to_training_day_links
    ADD CONSTRAINT session_to_training_day_links_user_training_day_id_fkey FOREIGN KEY (user_training_day_id) REFERENCES public.user_training_days(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: training_plans training_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_day_exercises user_day_exercises_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_day_exercises
    ADD CONSTRAINT user_day_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: user_day_exercises user_day_exercises_user_training_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_day_exercises
    ADD CONSTRAINT user_day_exercises_user_training_day_id_fkey FOREIGN KEY (user_training_day_id) REFERENCES public.user_training_days(id);


--
-- Name: user_exercise_sets user_exercise_sets_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_sets
    ADD CONSTRAINT user_exercise_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: user_exercise_sets user_exercise_sets_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_sets
    ADD CONSTRAINT user_exercise_sets_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: user_exercise_sets user_exercise_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_sets
    ADD CONSTRAINT user_exercise_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_training_days user_training_days_user_training_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_days
    ADD CONSTRAINT user_training_days_user_training_plan_id_fkey FOREIGN KEY (user_training_plan_id) REFERENCES public.user_training_plans(id);


--
-- Name: user_training_plans user_training_plans_base_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_plans
    ADD CONSTRAINT user_training_plans_base_plan_id_fkey FOREIGN KEY (base_plan_id) REFERENCES public.training_plans(id);


--
-- Name: user_training_plans user_training_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_training_plans
    ADD CONSTRAINT user_training_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: voice_memos voice_memos_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_memos
    ADD CONSTRAINT voice_memos_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: voice_memos voice_memos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_memos
    ADD CONSTRAINT voice_memos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wearable_data wearable_data_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wearable_data
    ADD CONSTRAINT wearable_data_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: wearable_data wearable_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wearable_data
    ADD CONSTRAINT wearable_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions Users can delete own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: body_stats Users can delete their own body stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own body stats" ON public.body_stats FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: sessions Users can insert own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wearable_data Users can insert own wearable data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own wearable data" ON public.wearable_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: body_stats Users can insert their own body stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own body stats" ON public.body_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: sessions Users can update own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: wearable_data Users can update own wearable data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own wearable data" ON public.wearable_data FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: body_stats Users can update their own body stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own body stats" ON public.body_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wearable_data Users can view own wearable data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own wearable data" ON public.wearable_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: body_stats Users can view their own body stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own body stats" ON public.body_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: body_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.body_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: exercises; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: media_uploads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: session_exercises; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: session_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.session_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: session_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: training_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: user_day_exercises; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_day_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: user_training_days; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_training_days ENABLE ROW LEVEL SECURITY;

--
-- Name: user_training_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_training_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: voice_memos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;

--
-- Name: wearable_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;

--
-- Name: user_training_plans ユーザーは自分のプランのみ作成可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランのみ作成可能" ON public.user_training_plans FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_training_plans ユーザーは自分のプランのみ削除可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランのみ削除可能" ON public.user_training_plans FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_training_plans ユーザーは自分のプランのみ参照可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランのみ参照可能" ON public.user_training_plans FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_training_plans ユーザーは自分のプランのみ更新可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランのみ更新可能" ON public.user_training_plans FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_training_days ユーザーは自分のプランの日のみ作成可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの日のみ作成可能" ON public.user_training_days FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_training_plans utp
  WHERE ((utp.id = user_training_days.user_training_plan_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_training_days ユーザーは自分のプランの日のみ削除可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの日のみ削除可能" ON public.user_training_days FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_training_plans utp
  WHERE ((utp.id = user_training_days.user_training_plan_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_training_days ユーザーは自分のプランの日のみ参照可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの日のみ参照可能" ON public.user_training_days FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_training_plans utp
  WHERE ((utp.id = user_training_days.user_training_plan_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_training_days ユーザーは自分のプランの日のみ更新可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの日のみ更新可能" ON public.user_training_days FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_training_plans utp
  WHERE ((utp.id = user_training_days.user_training_plan_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_day_exercises ユーザーは自分のプランの種目のみ作成可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの種目のみ作成可能" ON public.user_day_exercises FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_training_days utd
     JOIN public.user_training_plans utp ON ((utp.id = utd.user_training_plan_id)))
  WHERE ((utd.id = user_day_exercises.user_training_day_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_day_exercises ユーザーは自分のプランの種目のみ削除可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの種目のみ削除可能" ON public.user_day_exercises FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.user_training_days utd
     JOIN public.user_training_plans utp ON ((utp.id = utd.user_training_plan_id)))
  WHERE ((utd.id = user_day_exercises.user_training_day_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_day_exercises ユーザーは自分のプランの種目のみ参照可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの種目のみ参照可能" ON public.user_day_exercises FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.user_training_days utd
     JOIN public.user_training_plans utp ON ((utp.id = utd.user_training_plan_id)))
  WHERE ((utd.id = user_day_exercises.user_training_day_id) AND (utp.user_id = auth.uid())))));


--
-- Name: user_day_exercises ユーザーは自分のプランの種目のみ更新可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "ユーザーは自分のプランの種目のみ更新可能" ON public.user_day_exercises FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.user_training_days utd
     JOIN public.user_training_plans utp ON ((utp.id = utd.user_training_plan_id)))
  WHERE ((utd.id = user_day_exercises.user_training_day_id) AND (utp.user_id = auth.uid())))));


--
-- Name: exercises 認証ユーザーは種目を参照可能; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "認証ユーザーは種目を参照可能" ON public.exercises FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: TABLE body_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.body_stats TO anon;
GRANT ALL ON TABLE public.body_stats TO authenticated;
GRANT ALL ON TABLE public.body_stats TO service_role;


--
-- Name: SEQUENCE body_stats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.body_stats_id_seq TO anon;
GRANT ALL ON SEQUENCE public.body_stats_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.body_stats_id_seq TO service_role;


--
-- Name: TABLE exercises; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exercises TO anon;
GRANT ALL ON TABLE public.exercises TO authenticated;
GRANT ALL ON TABLE public.exercises TO service_role;


--
-- Name: TABLE legal_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.legal_documents TO anon;
GRANT ALL ON TABLE public.legal_documents TO authenticated;
GRANT ALL ON TABLE public.legal_documents TO service_role;


--
-- Name: TABLE media_uploads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_uploads TO anon;
GRANT ALL ON TABLE public.media_uploads TO authenticated;
GRANT ALL ON TABLE public.media_uploads TO service_role;


--
-- Name: SEQUENCE media_uploads_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_uploads_id_seq TO anon;
GRANT ALL ON SEQUENCE public.media_uploads_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_uploads_id_seq TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.notifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO service_role;


--
-- Name: TABLE session_exercises; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_exercises TO anon;
GRANT ALL ON TABLE public.session_exercises TO authenticated;
GRANT ALL ON TABLE public.session_exercises TO service_role;


--
-- Name: SEQUENCE session_exercises_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.session_exercises_id_seq TO anon;
GRANT ALL ON SEQUENCE public.session_exercises_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.session_exercises_id_seq TO service_role;


--
-- Name: TABLE session_shares; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_shares TO anon;
GRANT ALL ON TABLE public.session_shares TO authenticated;
GRANT ALL ON TABLE public.session_shares TO service_role;


--
-- Name: SEQUENCE session_shares_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.session_shares_id_seq TO anon;
GRANT ALL ON SEQUENCE public.session_shares_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.session_shares_id_seq TO service_role;


--
-- Name: TABLE session_summaries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_summaries TO anon;
GRANT ALL ON TABLE public.session_summaries TO authenticated;
GRANT ALL ON TABLE public.session_summaries TO service_role;


--
-- Name: SEQUENCE session_summaries_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.session_summaries_id_seq TO anon;
GRANT ALL ON SEQUENCE public.session_summaries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.session_summaries_id_seq TO service_role;


--
-- Name: TABLE session_to_training_day_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_to_training_day_links TO anon;
GRANT ALL ON TABLE public.session_to_training_day_links TO authenticated;
GRANT ALL ON TABLE public.session_to_training_day_links TO service_role;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sessions TO anon;
GRANT ALL ON TABLE public.sessions TO authenticated;
GRANT ALL ON TABLE public.sessions TO service_role;


--
-- Name: TABLE training_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.training_plans TO anon;
GRANT ALL ON TABLE public.training_plans TO authenticated;
GRANT ALL ON TABLE public.training_plans TO service_role;


--
-- Name: SEQUENCE training_plans_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.training_plans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.training_plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.training_plans_id_seq TO service_role;


--
-- Name: TABLE user_day_exercises; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_day_exercises TO anon;
GRANT ALL ON TABLE public.user_day_exercises TO authenticated;
GRANT ALL ON TABLE public.user_day_exercises TO service_role;


--
-- Name: TABLE user_exercise_sets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_exercise_sets TO anon;
GRANT ALL ON TABLE public.user_exercise_sets TO authenticated;
GRANT ALL ON TABLE public.user_exercise_sets TO service_role;


--
-- Name: TABLE user_training_days; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_training_days TO anon;
GRANT ALL ON TABLE public.user_training_days TO authenticated;
GRANT ALL ON TABLE public.user_training_days TO service_role;


--
-- Name: TABLE user_training_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_training_plans TO anon;
GRANT ALL ON TABLE public.user_training_plans TO authenticated;
GRANT ALL ON TABLE public.user_training_plans TO service_role;


--
-- Name: SEQUENCE user_training_plans_base_plan_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_training_plans_base_plan_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_training_plans_base_plan_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_training_plans_base_plan_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE voice_memos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.voice_memos TO anon;
GRANT ALL ON TABLE public.voice_memos TO authenticated;
GRANT ALL ON TABLE public.voice_memos TO service_role;


--
-- Name: SEQUENCE voice_memos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.voice_memos_id_seq TO anon;
GRANT ALL ON SEQUENCE public.voice_memos_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.voice_memos_id_seq TO service_role;


--
-- Name: TABLE wearable_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wearable_data TO anon;
GRANT ALL ON TABLE public.wearable_data TO authenticated;
GRANT ALL ON TABLE public.wearable_data TO service_role;


--
-- Name: SEQUENCE wearable_data_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wearable_data_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wearable_data_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wearable_data_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- PostgreSQL database dump complete
--

