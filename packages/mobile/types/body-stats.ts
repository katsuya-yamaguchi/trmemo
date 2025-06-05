export interface BodyStat {
  id: number;
  user_id: string;
  weight: number;
  body_fat_percentage?: number | null;
  recorded_at: string;
  created_at: string | null;
}

export interface BodyStatInput {
  weight: number;
  body_fat_percentage?: number;
  date: string; // YYYY-MM-DD format
}

export interface LatestBodyStats {
  weight: number;
  bodyFat?: number;
  recordedDate: string;
  previousWeight?: number;
  weightChange?: number;
  previousBodyFat?: number;
  bodyFatChange?: number;
}

export interface BodyStatsResponse {
  success: boolean;
  data?: BodyStat;
  error?: string;
} 