// services/api.ts
import Constants from 'expo-constants';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
import { Exercise, ExerciseLibraryResponse, TrainingPlan } from '../types/exercise';

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
  getProfile: async () => {
    return fetchWithAuth(`/user-profile`);
  },

  // プロフィール更新
  updateProfile: async (profileData: { name?: string; profile_image_url?: string }) => {
    return fetchWithAuth(`/user-profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // 体重・体組成記録
  recordBodyStats: async (stats: { weight: number, bodyFat?: number, date: string }) => {
    return fetchWithAuth(`/record-body-stats`, {
      method: 'POST',
      body: JSON.stringify(stats)
    });
  },

  // 体重履歴取得
  getBodyStatsHistory: async (period: string = 'month') => {
    return fetchWithAuth(`/body-stats-history?period=${period}`);
  },

  // 通知設定更新
  updateNotificationSettings: async (settings: { enabled: boolean, reminderTime?: string }) => {
    return fetchWithAuth(`/notification-settings`, {
      method: 'PUT',
      body: JSON.stringify({
        enabled: settings.enabled,
        reminder_time: settings.reminderTime
      })
    });
  }
};

// ワークアウト関連API
export const workoutApi = {
  // トレーニングプラン取得
  getTrainingPlan: async () => {
    // まず全プランを取得
    const plans = await fetchWithAuth(`/training-plan`);
    
    // プランが存在しない場合はnullを返す
    if (!plans || plans.length === 0) {
      return null;
    }
    
    // 最新のプラン（最初のプラン）の詳細を取得
    const latestPlan = plans[0];
    return fetchWithAuth(`/training-plan/${latestPlan.id}`);
  },

  // トレーニングプラン作成
  createTrainingPlan: async (planData: Omit<TrainingPlan, 'id' | 'created_at' | 'updated_at'>) => {
    return fetchWithAuth(`/training-plan/create`, {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  },

  // トレーニングプラン編集
  updateTrainingPlan: async (planId: string, planData: Partial<TrainingPlan>) => {
    return fetchWithAuth(`/training-plan/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    });
  },

  // トレーニングプラン削除
  deleteTrainingPlan: async (planId: string) => {
    return fetchWithAuth(`/training-plan/${planId}`, {
      method: 'DELETE'
    });
  },

  // 特定の日のトレーニング詳細を取得
  getDayWorkout: async (dayId: string) => {
    // TODO: このエンドポイントもEdge Functionに移行する必要あり
    return fetchWithAuth(`/training-plan/day/${dayId}`);
  },

  // 特定の日のトレーニング内容を更新
  updateDayWorkout: async (dayId: string, dayData: { title: string; estimated_duration: number; exercises: any[] }) => {
    return fetchWithAuth(`/training-plan/day/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(dayData)
    });
  },

  // トレーニングセッション開始
  startTrainingSession: async (dayId: string) => {
    // TODO: このエンドポイントもEdge Functionに移行する必要あり
    return fetchWithAuth(`/training-session/start`, {
      method: 'POST',
      body: JSON.stringify({ dayId })
    });
  },

  // トレーニングセッション完了
  completeTrainingSession: async (sessionId: string) => {
    // TODO: このエンドポイントもEdge Functionに移行する必要あり
    return fetchWithAuth(`/training-session/complete`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  },

  // エクササイズセット記録
  recordExerciseSet: async (sessionId: string, exerciseId: string, setNumber: number, weight: number, reps: number) => {
    // TODO: このエンドポイントもEdge Functionに移行する必要あり
    return fetchWithAuth(`/training-session/record`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, exerciseId, setNumber, weight, reps })
    });
  },

  // エクササイズライブラリ取得
  getExerciseLibrary: async (
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ExerciseLibraryResponse> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const endpoint = `/exercises?${params.toString()}`;
    return fetchWithAuth(endpoint);
  },

  // エクササイズ詳細取得
  getExerciseDetails: async (exerciseId: string): Promise<Exercise> => {
    const endpoint = `/exercises/${exerciseId}`;
    return fetchWithAuth(endpoint);
  },

  // 進捗データ取得
  getProgressData: async (dataType: string = 'weight', period: string = 'month') => {
    // userId は fetchWithAuth 内でセッションから取得されるため、引数からは削除
    // エンドポイントを新しいEdge Function '/progress-data' に変更
    // クエリパラメータ dataType と period を付加
    const endpoint = `/progress-data?dataType=${dataType}&period=${period}`;
    return fetchWithAuth(endpoint);
  },

  // トレーニング履歴取得
  getWorkoutHistory: async (limit: number = 5, offset: number = 0) => {
    const endpoint = `/workout-history?limit=${limit}&offset=${offset}`;
    return fetchWithAuth(endpoint);
  },

  // legal関連も修正が必要そうだが、今回はworkoutApiに集中
  getTermsOfService: async () => {
    // 認証不要なため、直接fetchを使用し、apikeyをヘッダーに付与
    const requestUrl = `${supabaseUrl}/functions/v1/legal/terms-of-service`;
    const response = await fetch(requestUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `APIリクエストに失敗しました (Status: ${response.status})`);
    }
    return response.json();
  },

  getPrivacyPolicy: async () => {
    // 認証不要なため、直接fetchを使用し、apikeyをヘッダーに付与
    const requestUrl = `${supabaseUrl}/functions/v1/legal/privacy-policy`;
    const response = await fetch(requestUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `APIリクエストに失敗しました (Status: ${response.status})`);
    }
    return response.json();
  },
  
  // Example of how it might be structured if it was part of a user object or similar
  // getUserSpecificLegalDoc: async (docType: string, userId: string) => {
  //   return fetchWithAuth(`/user/${userId}/legal/${docType}`); 
  // }
};