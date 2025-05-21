-- 各ユーザーのカスタムプラン
CREATE TABLE user_training_plans (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name TEXT,
    base_plan_id serial REFERENCES training_plans(id),
    start_date DATE,
    created_at TIMESTAMP DEFAULT now()
);

-- 曜日 or Day別（例：Day 1〜）
CREATE TABLE user_training_days (
    id UUID PRIMARY KEY,
    user_training_plan_id UUID REFERENCES user_training_plans(id),
    day_number INT,
    title TEXT,
    estimated_duration INT, -- 単位: 分
    created_at TIMESTAMP DEFAULT now()
);

-- 種目テンプレ
CREATE TABLE user_day_exercises (
    id UUID PRIMARY KEY,
    user_training_day_id UUID REFERENCES user_training_days(id),
    exercise_id UUID REFERENCES exercises(id),
    set_count INT,
    rep_min INT,
    rep_max INT,
    created_at TIMESTAMP DEFAULT now()
);

-- セットごとの記録（完了分のみ保存）
CREATE TABLE user_exercise_sets (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    exercise_id UUID REFERENCES exercises(id),
    set_number INT,
    weight NUMERIC,
    reps INT,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

create table public.exercises (
  id uuid not null,dd
  name text not null,
  muscle_group text null,
  description text null,
  created_at timestamp without time zone null default now(),
  constraint exercises_pkey primary key (id)
) TABLESPACE pg_default;

create table public.media_uploads (
  id serial not null,
  session_id uuid not null,
  user_id uuid not null,
  media_type character varying(50) null,
  file_url character varying(255) null,
  caption text null,
  created_at timestamp with time zone null default now(),
  constraint media_uploads_pkey primary key (id),
  constraint media_uploads_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint media_uploads_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.notifications (
  id serial not null,
  user_id uuid not null,
  notification_type character varying(50) null,
  message text null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.session_exercises (
  id serial not null,
  session_id uuid not null,
  exercise_name character varying(100) not null,
  weight numeric(10, 2) null,
  reps integer null,
  rest_time integer null,
  created_at timestamp with time zone null default now(),
  constraint session_exercises_pkey primary key (id),
  constraint session_exercises_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.session_shares (
  id serial not null,
  session_id uuid not null,
  user_id uuid not null,
  platform character varying(50) null,
  share_status character varying(50) null,
  created_at timestamp with time zone null default now(),
  constraint session_shares_pkey primary key (id),
  constraint session_shares_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint session_shares_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.session_summaries (
  id serial not null,
  session_id uuid not null,
  user_id uuid not null,
  summary_text text null,
  avg_heart_rate integer null,
  max_heart_rate integer null,
  total_calories numeric(10, 2) null,
  feedback text null,
  created_at timestamp with time zone null default now(),
  constraint session_summaries_pkey primary key (id),
  constraint session_summaries_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint session_summaries_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone null,
  duration interval null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sessions_pkey primary key (id),
  constraint sessions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.training_plans (
  id serial not null,
  user_id uuid not null,
  plan_text text null,
  valid_from date null,
  valid_to date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint training_plans_pkey primary key (id),
  constraint training_plans_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_training_plans (
  id uuid not null,
  user_id uuid null,
  name text null,
  base_plan_id serial not null,
  start_date date null,
  created_at timestamp without time zone null default now(),
  constraint user_training_plans_pkey primary key (id),
  constraint user_training_plans_base_plan_id_fkey foreign KEY (base_plan_id) references training_plans (id),
  constraint user_training_plans_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create table public.users (
  id uuid not null,
  email character varying(255) not null,
  password_hash character varying(255) null,
  name character varying(100) null,
  profile_image_url character varying(255) null,
  two_factor_enabled boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.voice_memos (
  id serial not null,
  session_id uuid not null,
  user_id uuid not null,
  transcript text null,
  audio_file_url character varying(255) null,
  created_at timestamp with time zone null default now(),
  constraint voice_memos_pkey primary key (id),
  constraint voice_memos_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint voice_memos_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.wearable_data (
  id serial not null,
  session_id uuid not null,
  user_id uuid not null,
  sensor_type character varying(50) not null,
  value numeric(10, 2) null,
  recorded_at timestamp with time zone not null,
  constraint wearable_data_pkey primary key (id),
  constraint wearable_data_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint wearable_data_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
