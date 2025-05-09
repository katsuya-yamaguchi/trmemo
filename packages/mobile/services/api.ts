// services/api.ts
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// APIのベースURL
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// ヘルパー関数: APIリクエストの基本設定
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // 認証トークンを取得
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // デフォルトヘッダーを設定
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // APIリクエストを実行
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  // エラーチェック
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ホーム画面関連API
export const homeApi = {
  // ホーム画面データの取得
  getHomeScreenData: async (userId: string) => {
    return fetchWithAuth(`/home?userId=${userId}`);
  }
};

// ユーザー関連API
export const userApi = {
  // プロフィール取得
  getProfile: async (userId: string) => {
    return fetchWithAuth(`/users/profile?userId=${userId}`);
  },

  // プロフィール更新
  updateProfile: async (userId: string, profileData: any) => {
    return fetchWithAuth(`/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...profileData })
    });
  },

  // 体重・体組成記録
  recordBodyStats: async (userId: string, stats: { weight: number, bodyFat?: number, date: Date }) => {
    return fetchWithAuth(`/users/body-stats`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...stats })
    });
  },

  // 体重履歴取得
  getBodyStatsHistory: async (userId: string, period: string = 'month') => {
    return fetchWithAuth(`/users/body-stats?userId=${userId}&period=${period}`);
  },

  // 通知設定更新
  updateNotificationSettings: async (userId: string, settings: { enabled: boolean, reminderTime: string }) => {
    return fetchWithAuth(`/users/notifications`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...settings })
    });
  }
};

// ワークアウト関連API
export const workoutApi = {
  // トレーニングプラン取得
  getTrainingPlan: async (userId: string) => {
    return fetchWithAuth(`/workouts/plan?userId=${userId}`);
  },

  // 特定の日のトレーニング詳細を取得
  getDayWorkout: async (dayId: string) => {
    return fetchWithAuth(`/workouts/day/${dayId}`);
  },

  // トレーニングセッション開始
  startTrainingSession: async (userId: string, dayId: string) => {
    return fetchWithAuth(`/workouts/session/start`, {
      method: 'POST',
      body: JSON.stringify({ userId, dayId })
    });
  },

  // トレーニングセッション完了
  completeTrainingSession: async (sessionId: string) => {
    return fetchWithAuth(`/workouts/session/complete`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  },

  // エクササイズセット記録
  recordExerciseSet: async (sessionId: string, exerciseId: string, setNumber: number, weight: number, reps: number) => {
    return fetchWithAuth(`/workouts/record`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, exerciseId, setNumber, weight, reps })
    });
  },

  // エクササイズライブラリ取得
  getExerciseLibrary: async (category?: string, search?: string) => {
    let endpoint = `/workouts/exercises`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
    
    return fetchWithAuth(endpoint);
  },

  // エクササイズ詳細取得
  getExerciseDetails: async (exerciseId: string) => {
    return fetchWithAuth(`/workouts/exercises/${exerciseId}`);
  },

  // 進捗データ取得
  getProgressData: async (userId: string, dataType: string = 'weight', period: string = 'month') => {
    return fetchWithAuth(`/workouts/progress?userId=${userId}&dataType=${dataType}&period=${period}`);
  },

  // トレーニング履歴取得
  getWorkoutHistory: async (userId: string, limit: number = 5, offset: number = 0) => {
    return fetchWithAuth(`/workouts/history?userId=${userId}&limit=${limit}&offset=${offset}`);
  },

  getTermsOfService: async () => {
    return fetchWithAuth('/legal/terms-of-service'); // No userId needed for public content
  },

  getPrivacyPolicy: async () => {
    return fetchWithAuth('/legal/privacy-policy'); // No userId needed for public content
  },
  
  // Example of how it might be structured if it was part of a user object or similar
  // getUserSpecificLegalDoc: async (docType: string, userId: string) => {
  //   return fetchWithAuth(`/user/${userId}/legal/${docType}`); 
  // }
};