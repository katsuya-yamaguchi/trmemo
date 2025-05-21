CREATE TABLE public.session_to_training_day_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主キー (自動生成UUID)
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_training_day_id UUID NOT NULL REFERENCES public.user_training_days(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_session_training_day UNIQUE (session_id, user_training_day_id) -- 組み合わせのユニーク制約 (任意)
);

-- 検索パフォーマンス向上のためのインデックス (任意)
CREATE INDEX idx_session_links_session_id ON public.session_to_training_day_links (session_id);
CREATE INDEX idx_session_links_user_training_day_id ON public.session_to_training_day_links (user_training_day_id);

COMMENT ON TABLE public.session_to_training_day_links IS 'トレーニングセッションと特定のトレーニング日を紐付ける中間テーブル';
COMMENT ON COLUMN public.session_to_training_day_links.session_id IS 'セッションのID (sessions.id への外部キー)';
COMMENT ON COLUMN public.session_to_training_day_links.user_training_day_id IS 'ユーザートレーニング日のID (user_training_days.id への外部キー)';