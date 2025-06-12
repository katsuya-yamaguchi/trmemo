// services/api.ts
import Constants from 'expo-constants';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
import { Exercise, ExerciseLibraryResponse } from '../types/exercise';
import { BodyStat, BodyStatInput, LatestBodyStats, BodyStatsResponse } from '../types/body-stats';
import { Workout, CreateWorkoutRequest, UpdateWorkoutRequest, WorkoutsResponse, WorkoutResponse } from '../types/workout';

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
  recordBodyStats: async (stats: { weight: number, bodyFat?: number, date: string }): Promise<BodyStatsResponse> => {
    try {
      const result = await fetchWithAuth(`/record-body-stats`, {
        method: 'POST',
        body: JSON.stringify({
          weight: stats.weight,
          body_fat: stats.bodyFat,
          date: stats.date
        })
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 最新の体重・体脂肪率データ取得
  getLatestBodyStats: async (): Promise<LatestBodyStats | null> => {
    try {
      const data = await fetchWithAuth(`/body-stats-history?period=latest&limit=2`);
      console.log('API から取得したraw データ:', data);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('データが空またはnull');
        return null;
      }
      
      const latest = data[0];
      const previous = data.length > 1 ? data[1] : null;
      console.log('最新レコード:', latest);
      console.log('前回レコード:', previous);
      
      const result: LatestBodyStats = {
        weight: latest.weight,
        bodyFat: latest.body_fat_percentage,
        recordedDate: latest.recorded_at,
      };
      console.log('変換後の result:', result);
      
      if (previous) {
        result.previousWeight = previous.weight;
        result.weightChange = latest.weight - previous.weight;
        if (previous.body_fat_percentage && latest.body_fat_percentage) {
          result.previousBodyFat = previous.body_fat_percentage;
          result.bodyFatChange = latest.body_fat_percentage - previous.body_fat_percentage;
        } else if (previous.body_fat_percentage) {
          // 前回の体脂肪率データがある場合は設定（現在が未記録でも）
          result.previousBodyFat = previous.body_fat_percentage;
        }
      }
      
      console.log('最終的な result:', result);
      return result;
    } catch (error) {
      console.error('最新体重データ取得エラー:', error);
      return null;
    }
  },

  // 体重履歴取得
  getBodyStatsHistory: async (period: string = 'month'): Promise<BodyStat[]> => {
    try {
      const data = await fetchWithAuth(`/body-stats-history?period=${period}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('体重履歴取得エラー:', error);
      return [];
    }
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
  // === 新しいワークアウトAPI ===
  
  // 全ワークアウト取得
  getWorkouts: async (): Promise<WorkoutsResponse> => {
    return fetchWithAuth('/workout-management');
  },

  // 特定ワークアウト取得
  getWorkout: async (workoutId: string): Promise<WorkoutResponse> => {
    return fetchWithAuth(`/workout-management/${workoutId}`);
  },

  // ワークアウト作成
  createWorkout: async (workoutData: CreateWorkoutRequest): Promise<WorkoutResponse> => {
    return fetchWithAuth('/workout-management', {
      method: 'POST',
      body: JSON.stringify(workoutData)
    });
  },

  // ワークアウト更新
  updateWorkout: async (workoutId: string, workoutData: UpdateWorkoutRequest): Promise<WorkoutResponse> => {
    return fetchWithAuth(`/workout-management/${workoutId}`, {
      method: 'PUT',
      body: JSON.stringify(workoutData)
    });
  },

  // ワークアウト削除
  deleteWorkout: async (workoutId: string): Promise<{ message: string }> => {
    return fetchWithAuth(`/workout-management/${workoutId}`, {
      method: 'DELETE'
    });
  },

  // === 廃止されたトレーニングプランAPI ===
  // 注意: これらの関数は廃止されました。新しいワークアウトAPIを使用してください。

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

  // ユーザーが実行した種目一覧取得
  getUserExercises: async () => {
    const endpoint = `/progress-data/user-exercises`;
    return fetchWithAuth(endpoint);
  },

  // 種目別履歴データ取得
  getExerciseHistory: async (exerciseId: string, period: string = 'month', year?: number, month?: number) => {
    const params = new URLSearchParams();
    params.append('exerciseId', exerciseId);
    params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const endpoint = `/progress-data/exercise-history?${params.toString()}`;
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