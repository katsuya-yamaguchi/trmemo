ALTER TABLE public.user_exercise_sets
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL; -- または ON DELETE CASCADE
