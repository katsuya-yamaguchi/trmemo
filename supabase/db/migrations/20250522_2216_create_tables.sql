-- id カラムにデフォルト値を追加 (もし未設定の場合)
ALTER TABLE public.exercises
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- created_at カラムを TIMESTAMPTZ に変更し、デフォルト値を設定 (もし型が異なり、TZ情報がない場合)
ALTER TABLE public.exercises
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc', NOW());

-- 不足しているカラムを追加
ALTER TABLE public.exercises
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (type IN ('barbell', 'dumbbell', 'band', 'machine', 'other')),
    ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS target_muscles TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    ADD COLUMN IF NOT EXISTS equipment TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- description カラムの型を TEXT に統一 (もし異なれば)
ALTER TABLE public.exercises
    ALTER COLUMN description TYPE TEXT;

-- muscle_group カラムの型を TEXT に統一 (もし異なれば)
ALTER TABLE public.exercises
    ALTER COLUMN muscle_group TYPE TEXT;


-- 既存の user_training_plans テーブルを拡張 --
ALTER TABLE public.user_training_plans
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 既存の user_training_days テーブルを拡張 --
ALTER TABLE public.user_training_days
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());


-- 既存の user_day_exercises テーブルを拡張 --
ALTER TABLE public.user_day_exercises
    ADD COLUMN IF NOT EXISTS default_weight VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reps VARCHAR(50) NOT NULL DEFAULT '0', -- 既存の rep_min, rep_max から移行するか、アプリ側で対応
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- set_count カラムの型を INT に統一 (もし異なれば)
ALTER TABLE public.user_day_exercises
    ALTER COLUMN set_count TYPE INTEGER;


-- 更新日時を自動更新するトリガー関数 (存在しない場合のみ作成) --
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
--         CREATE FUNCTION public.update_updated_at_column()
--         RETURNS TRIGGER AS $function$
--         BEGIN
--             NEW.updated_at = TIMEZONE('utc', NOW());
--             RETURN NEW;
--         END;
--         $function$ LANGUAGE 'plpgsql';
--     END IF;
-- END
-- $$;

-- トリガーを各テーブルに設定 --
-- DROP TRIGGER IF EXISTS update_exercises_updated_at ON public.exercises;
-- CREATE TRIGGER update_exercises_updated_at
--     BEFORE UPDATE ON public.exercises
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_user_training_plans_updated_at ON public.user_training_plans;
-- CREATE TRIGGER update_user_training_plans_updated_at
--     BEFORE UPDATE ON public.user_training_plans
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_user_training_days_updated_at ON public.user_training_days;
-- CREATE TRIGGER update_user_training_days_updated_at
--     BEFORE UPDATE ON public.user_training_days
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_user_day_exercises_updated_at ON public.user_day_exercises;
-- CREATE TRIGGER update_user_day_exercises_updated_at
--     BEFORE UPDATE ON public.user_day_exercises
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();


-- RLSポリシーの設定 --
-- (注意: user_id カラムは public.users.id を参照しており, public.users.id は auth.users.id を参照しています)

-- exercises テーブルは公開情報としてRLSを緩めるか、認証ユーザーのみ読み取り可能にするか選択できます。
-- ここでは認証ユーザーなら誰でも読み取り可能とします。変更や削除はさせません。
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "認証ユーザーは種目を参照可能" ON public.exercises;
CREATE POLICY "認証ユーザーは種目を参照可能" ON public.exercises
    FOR SELECT
    USING (auth.role() = 'authenticated');


ALTER TABLE public.user_training_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ユーザーは自分のプランのみ参照可能" ON public.user_training_plans;
CREATE POLICY "ユーザーは自分のプランのみ参照可能" ON public.user_training_plans
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ユーザーは自分のプランのみ作成可能" ON public.user_training_plans;
CREATE POLICY "ユーザーは自分のプランのみ作成可能" ON public.user_training_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ユーザーは自分のプランのみ更新可能" ON public.user_training_plans;
CREATE POLICY "ユーザーは自分のプランのみ更新可能" ON public.user_training_plans
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ユーザーは自分のプランのみ削除可能" ON public.user_training_plans;
CREATE POLICY "ユーザーは自分のプランのみ削除可能" ON public.user_training_plans
    FOR DELETE
    USING (auth.uid() = user_id);


ALTER TABLE public.user_training_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ユーザーは自分のプランの日のみ参照可能" ON public.user_training_days;
CREATE POLICY "ユーザーは自分のプランの日のみ参照可能" ON public.user_training_days
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_training_plans utp
        WHERE utp.id = user_training_days.user_training_plan_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの日のみ作成可能" ON public.user_training_days;
CREATE POLICY "ユーザーは自分のプランの日のみ作成可能" ON public.user_training_days
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_training_plans utp
        WHERE utp.id = user_training_days.user_training_plan_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの日のみ更新可能" ON public.user_training_days;
CREATE POLICY "ユーザーは自分のプランの日のみ更新可能" ON public.user_training_days
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_training_plans utp
        WHERE utp.id = user_training_days.user_training_plan_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの日のみ削除可能" ON public.user_training_days;
CREATE POLICY "ユーザーは自分のプランの日のみ削除可能" ON public.user_training_days
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.user_training_plans utp
        WHERE utp.id = user_training_days.user_training_plan_id
        AND utp.user_id = auth.uid()
    ));


ALTER TABLE public.user_day_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ユーザーは自分のプランの種目のみ参照可能" ON public.user_day_exercises;
CREATE POLICY "ユーザーは自分のプランの種目のみ参照可能" ON public.user_day_exercises
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_training_days utd
        JOIN public.user_training_plans utp ON utp.id = utd.user_training_plan_id
        WHERE utd.id = user_day_exercises.user_training_day_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの種目のみ作成可能" ON public.user_day_exercises;
CREATE POLICY "ユーザーは自分のプランの種目のみ作成可能" ON public.user_day_exercises
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_training_days utd
        JOIN public.user_training_plans utp ON utp.id = utd.user_training_plan_id
        WHERE utd.id = user_day_exercises.user_training_day_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの種目のみ更新可能" ON public.user_day_exercises;
CREATE POLICY "ユーザーは自分のプランの種目のみ更新可能" ON public.user_day_exercises
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_training_days utd
        JOIN public.user_training_plans utp ON utp.id = utd.user_training_plan_id
        WHERE utd.id = user_day_exercises.user_training_day_id
        AND utp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "ユーザーは自分のプランの種目のみ削除可能" ON public.user_day_exercises;
CREATE POLICY "ユーザーは自分のプランの種目のみ削除可能" ON public.user_day_exercises
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.user_training_days utd
        JOIN public.user_training_plans utp ON utp.id = utd.user_training_plan_id
        WHERE utd.id = user_day_exercises.user_training_day_id
        AND utp.user_id = auth.uid()
    ));
