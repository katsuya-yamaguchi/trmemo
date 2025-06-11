-- body_statsテーブルにUNIQUE制約を追加
-- ユーザーごとに1日1回の記録制限を実装

-- Step 1: まず制約が既に存在するかチェック
DO $$
BEGIN
    -- 制約が既に存在する場合は何もしない
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'body_stats' 
        AND constraint_name = 'unique_user_recorded_date'
        AND constraint_type = 'UNIQUE'
    ) THEN
        
        -- Step 2: 重複データがあるかチェック（あれば最古のレコード以外を削除）
        WITH duplicates AS (
            SELECT user_id, recorded_at, MIN(created_at) as earliest_created_at
            FROM body_stats
            GROUP BY user_id, recorded_at
            HAVING COUNT(*) > 1
        )
        DELETE FROM body_stats 
        WHERE (user_id, recorded_at) IN (
            SELECT user_id, recorded_at FROM duplicates
        )
        AND created_at NOT IN (
            SELECT earliest_created_at FROM duplicates d
            WHERE d.user_id = body_stats.user_id 
            AND d.recorded_at = body_stats.recorded_at
        );

        -- Step 3: UNIQUE制約を追加
        ALTER TABLE body_stats 
        ADD CONSTRAINT unique_user_recorded_date 
        UNIQUE (user_id, recorded_at);
        
        RAISE NOTICE 'UNIQUE制約 unique_user_recorded_date を追加しました';
    ELSE
        RAISE NOTICE 'UNIQUE制約 unique_user_recorded_date は既に存在します';
    END IF;
END
$$; 