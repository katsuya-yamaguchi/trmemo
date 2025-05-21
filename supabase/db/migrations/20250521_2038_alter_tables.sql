-- uuid-ossp エクステンションが有効でない場合に備えて (Supabaseプロジェクトでは通常不要)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.user_exercise_sets
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
