-- public.body_stats テーブルへのサンプルデータ挿入 DML
DO $$
DECLARE
    sample_user_id UUID := 'f0f84845-c378-467a-8690-048ecc185cb7'; -- 存在するユーザーIDに変更してください
BEGIN
    -- 既存のサンプルデータをクリアする場合 (必要に応じてコメント解除)
     DELETE FROM public.body_stats WHERE user_id = sample_user_id;

    -- 過去1ヶ月程度のサンプルデータを挿入
    INSERT INTO public.body_stats
      (user_id, weight, body_fat_percentage, recorded_at)
    VALUES
      (sample_user_id, 75.5, 15.2, now() - interval '30 days')
     , (sample_user_id, 75.1, 15.0, now() - interval '28 days')
     , (sample_user_id, 74.8, 14.8, now() - interval '25 days')
     , (sample_user_id, 75.0, 14.9, now() - interval '21 days')
     , (sample_user_id, 74.5, 14.5, now() - interval '18 days')
     , (sample_user_id, 74.2, 14.3, now() - interval '14 days')
     , (sample_user_id, 74.0, 14.1, now() - interval '10 days')
     , (sample_user_id, 73.8, 14.0, now() - interval '7 days')
     , (sample_user_id, 73.5, 13.8, now() - interval '4 days')
     , (sample_user_id, 73.6, 13.9, now() - interval '1 day')
    ;
END $$;