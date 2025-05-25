-- 種目マスターテーブル
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('barbell', 'dumbbell', 'band', 'machine', 'other')),
    image_url TEXT NOT NULL,
    description TEXT,
    target_muscles TEXT[] NOT NULL DEFAULT '{}',
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    equipment TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- トレーニングプランテーブル
CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- トレーニング日テーブル
CREATE TABLE training_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    title VARCHAR(255) NOT NULL,
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (plan_id, day_number)
);

-- トレーニング種目テーブル
CREATE TABLE training_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    sets INTEGER NOT NULL CHECK (sets > 0),
    reps VARCHAR(50) NOT NULL,
    default_weight VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at
    BEFORE UPDATE ON training_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_days_updated_at
    BEFORE UPDATE ON training_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_exercises_updated_at
    BEFORE UPDATE ON training_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーの設定
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

-- トレーニングプランのポリシー
CREATE POLICY "ユーザーは自分のプランのみ参照可能" ON training_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプランのみ作成可能" ON training_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプランのみ更新可能" ON training_plans
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプランのみ削除可能" ON training_plans
    FOR DELETE
    USING (auth.uid() = user_id);

-- トレーニング日のポリシー
CREATE POLICY "ユーザーは自分のプランの日のみ参照可能" ON training_days
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM training_plans
        WHERE training_plans.id = training_days.plan_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの日のみ作成可能" ON training_days
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM training_plans
        WHERE training_plans.id = training_days.plan_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの日のみ更新可能" ON training_days
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM training_plans
        WHERE training_plans.id = training_days.plan_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの日のみ削除可能" ON training_days
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM training_plans
        WHERE training_plans.id = training_days.plan_id
        AND training_plans.user_id = auth.uid()
    ));

-- トレーニング種目のポリシー
CREATE POLICY "ユーザーは自分のプランの種目のみ参照可能" ON training_exercises
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM training_days
        JOIN training_plans ON training_plans.id = training_days.plan_id
        WHERE training_days.id = training_exercises.day_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの種目のみ作成可能" ON training_exercises
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM training_days
        JOIN training_plans ON training_plans.id = training_days.plan_id
        WHERE training_days.id = training_exercises.day_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの種目のみ更新可能" ON training_exercises
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM training_days
        JOIN training_plans ON training_plans.id = training_days.plan_id
        WHERE training_days.id = training_exercises.day_id
        AND training_plans.user_id = auth.uid()
    ));

CREATE POLICY "ユーザーは自分のプランの種目のみ削除可能" ON training_exercises
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM training_days
        JOIN training_plans ON training_plans.id = training_days.plan_id
        WHERE training_days.id = training_exercises.day_id
        AND training_plans.user_id = auth.uid()
    )); 