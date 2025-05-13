// services/api.ts
import Constants from 'expo-constants';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';

// APIのベースURL
// const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// ヘルパー関数: APIリクエストの基本設定
const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  console.log(`fetchWithAuth: Starting for path: ${path}`);
  let session: Session | null = null;
  let authError: AuthError | null = null;
  let caughtError: unknown = null;

  try {
    console.log("fetchWithAuth: Attempting supabase.auth.getSession()...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    session = sessionData?.session ?? null;
    authError = sessionError;
    console.log("fetchWithAuth: getSession() result:", { session: session ? 'Exists' : 'null', error: authError });
  } catch (error) {
    console.error("fetchWithAuth: CRITICAL - Error during getSession() call itself:", error);
    caughtError = error;
  }

  if (caughtError || authError || !session) {
    console.error('fetchWithAuth: Session error, no session, or getSession failed. Throwing error...', 
                  { caughtError, authError, sessionExists: !!session });
    const errorMessage = caughtError ? 'セッション取得中に予期せぬエラー' : 
                         authError ? `認証エラー: ${authError.message}` : 
                         '認証が必要です (セッションなし)';
    throw new Error(errorMessage);
  }

  console.log(`fetchWithAuth: Session acquired for user ${session.user.id}. Proceeding to fetch ${path}`);

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json'
  };

  const requestUrl = `${supabaseUrl}/functions/v1${path}`;
  console.log("fetchWithAuth: Sending request to URL:", requestUrl);
  console.log("fetchWithAuth: Sending headers:", JSON.stringify(headers, null, 2));

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });
  console.log(`fetchWithAuth: Fetch response status: ${response.status} for ${path}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error(`fetchWithAuth: API Error for ${path}:`, { status: response.status, errorData });
    throw new Error(errorData.message || `APIリクエストに失敗しました (Status: ${response.status})`);
  }

  console.log(`fetchWithAuth: Successfully fetched ${path}`);
  return response.json();
};

// ホーム画面関連API
export const homeApi = {
  // ホーム画面データの取得
  getHomeScreenData: async () => {
    // パスを'/home'に変更し、クエリパラメータを削除
    return fetchWithAuth(`/home`);
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