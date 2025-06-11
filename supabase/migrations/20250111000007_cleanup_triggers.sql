-- 既存のupdated_atトリガーをクリーンアップ
-- バックエンドコード側で管理するため、トリガーは不要

-- body_statsテーブルのupdated_atトリガーを削除
DROP TRIGGER IF EXISTS update_body_stats_updated_at ON body_stats;

-- メッセージ
DO $$
BEGIN
    RAISE NOTICE 'updated_atトリガーを削除しました（バックエンドコード管理に移行）';
END
$$; 