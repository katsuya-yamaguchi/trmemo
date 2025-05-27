-- session_summaries テーブルに total_distinct_exercises カラムを追加
ALTER TABLE public.session_summaries
    ADD COLUMN IF NOT EXISTS total_distinct_exercises INTEGER NOT NULL DEFAULT 0;

-- カラムにコメントを追加
COMMENT ON COLUMN public.session_summaries.total_distinct_exercises IS 'セッション内で行われたユニークな種目の総数';

-- 既存のRLSポリシーに影響がないか確認してください。
-- 通常、カラムの追加は既存のSELECT, INSERT, UPDATE, DELETEポリシーには直接影響しませんが、
-- 新しいカラムをポリシーの条件で使用する場合は、ポリシーの再定義が必要になることがあります。
-- 今回はデフォルト値があり、NOT NULL制約があるため、INSERT時に値が必須となります。
-- SELECTに関しては既存のポリシーがそのまま適用されます。
