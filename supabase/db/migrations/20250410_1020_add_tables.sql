-- public.body_stats テーブル作成 DDL

CREATE TABLE public.body_stats (
    id SERIAL PRIMARY KEY, -- 自動インクリメントの整数ID
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- ユーザーテーブルへの参照 (削除時カスケード)
    weight NUMERIC(5, 2) NOT NULL, -- 体重 (例: 150.50 kg まで、小数点以下2桁)
    body_fat_percentage NUMERIC(4, 2) NULL, -- 体脂肪率 (例: 99.99 % まで、小数点以下2桁、NULL許容)
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 記録日時 (タイムゾーン付き、デフォルトは現在時刻)
    created_at TIMESTAMPTZ DEFAULT now() -- 作成日時
);

-- 検索パフォーマンス向上のためのインデックス作成
CREATE INDEX idx_body_stats_user_id_recorded_at ON public.body_stats (user_id, recorded_at DESC);
CREATE INDEX idx_body_stats_recorded_at ON public.body_stats (recorded_at DESC);

-- テーブルとカラムにコメントを追加 (任意ですが推奨)
COMMENT ON TABLE public.body_stats IS 'ユーザーの体重と体組成の記録';
COMMENT ON COLUMN public.body_stats.user_id IS '記録したユーザーのID (users.id への外部キー)';
COMMENT ON COLUMN public.body_stats.weight IS '記録された体重 (kg)';
COMMENT ON COLUMN public.body_stats.body_fat_percentage IS '記録された体脂肪率 (%)';
COMMENT ON COLUMN public.body_stats.recorded_at IS 'データが記録された日時';
COMMENT ON COLUMN public.body_stats.created_at IS 'レコードが作成された日時';
