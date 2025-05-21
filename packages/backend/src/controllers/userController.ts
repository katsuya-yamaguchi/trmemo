// src/controllers/userController.ts
import { Request, Response } from 'express';
import supabase from '../config/database';

// ユーザープロフィールを更新 (この関数全体を削除)
// export const updateUserProfile = async (req: Request, res: Response) => { ... };

// ユーザーの体重・体組成データを記録 // この関数全体を削除
/*
export const recordBodyStats = async (req: Request, res: Response) => {
  try {
    const { userId, weight, bodyFat, date } = req.body;

    if (!userId || !weight || !date) {
      return res.status(400).json({ message: '必須項目が不足しています' });
    }

    // 体重・体組成データを保存
    const { data, error } = await supabase
      .from('user_body_stats')
      .insert({
        user_id: userId,
        weight,
        body_fat: bodyFat,
        recorded_date: new Date(date),
        created_at: new Date()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: '体重データの記録に失敗しました', error });
    }

    res.json({ 
      message: '体重データを記録しました',
      data
    });
  } catch (error) {
    console.error('体重記録エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};
*/

// Add type definitions for BodyStat and ChartData
interface BodyStat {
  recorded_date: string | Date;
  weight: number;
  // body_fat?: number; // Add if used, for example
}

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

// ユーザーの体重履歴を取得 // この関数全体を削除またはコメントアウト
/*
export const getBodyStatsHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const period = req.query.period as string || 'month'; // 'week', 'month', 'year'

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    // 期間に基づいて日付範囲を計算
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // 体重履歴を取得
    const { data, error } = await supabase
      .from('user_body_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_date', startDate.toISOString())
      .lte('recorded_date', endDate.toISOString())
      .order('recorded_date', { ascending: false });

    if (error) {
      return res.status(400).json({ message: '体重履歴の取得に失敗しました', error });
    }

    // 最新の体重と開始時の体重を計算
    let currentWeight = null;
    let startWeight = null;
    let weightChange = null;

    if (data && data.length > 0) {
      currentWeight = data[0].weight;
      startWeight = data[data.length - 1].weight;
      weightChange = currentWeight - startWeight;
    }

    // チャート用にデータを整形
    const chartData = formatChartData(data, period);

    res.json({
      history: data,
      stats: {
        current: currentWeight,
        start: startWeight,
        change: weightChange
      },
      chartData
    });
  } catch (error) {
    console.error('体重履歴取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};
*/

// チャート用にデータを整形する関数 // この関数全体を削除またはコメントアウト
/*
const formatChartData = (data: BodyStat[], period: string): ChartData => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  // 日付でソート
  const sortedData = [...data].sort((a, b) => 
    new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
  );

  let labels: string[] = [];
  let values: number[] = [];

  if (period === 'week') {
    // 週の場合は各日を表示
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      labels.push(date.toLocaleDateString('ja-JP', { weekday: 'short' }));
      values.push(entry.weight);
    });
  } else if (period === 'month') {
    // 月の場合は週を表示
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      values.push(entry.weight);
    });
  } else {
    // 年の場合は月を表示
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      labels.push(`${date.getMonth() + 1}月`);
      values.push(entry.weight);
    });
  }

  return {
    labels,
    datasets: [
      {
        data: values
      }
    ]
  };
};
*/

// 通知設定を更新 // この関数全体を削除またはコメントアウト
/*
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const { userId, enabled, reminderTime } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    // 通知設定を更新
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        notifications_enabled: enabled,
        reminder_time: reminderTime,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // 設定が存在しない場合は新規作成
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          notifications_enabled: enabled,
          reminder_time: reminderTime,
          created_at: new Date()
        })
        .select()
        .single();

      if (insertError) {
        return res.status(400).json({ message: '通知設定の保存に失敗しました', error: insertError });
      }

      return res.json(newData);
    }

    res.json(data);
  } catch (error) {
    console.error('通知設定更新エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};
*/