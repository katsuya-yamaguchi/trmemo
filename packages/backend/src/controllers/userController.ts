// src/controllers/userController.ts
import { Request, Response } from 'express';
import supabase from '../config/database';

// ユーザープロフィール情報を取得
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    // ユーザー情報を取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ message: 'ユーザーが見つかりません', error: userError });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profile_image_url,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('ユーザープロフィール取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// ユーザープロフィールを更新
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const { name, profileImageUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    // プロフィール情報を更新
    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        profile_image_url: profileImageUrl,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'プロフィール更新に失敗しました', error });
    }

    res.json({
      id: data.id,
      email: data.email,
      name: data.name,
      profileImageUrl: data.profile_image_url,
      twoFactorEnabled: data.two_factor_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// ユーザーの体重・体組成データを記録
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

// ユーザーの体重履歴を取得
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

// チャート用にデータを整形する関数
const formatChartData = (data, period) => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  // 日付でソート
  const sortedData = [...data].sort((a, b) => 
    new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
  );

  let labels = [];
  let values = [];

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

// 通知設定を更新
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