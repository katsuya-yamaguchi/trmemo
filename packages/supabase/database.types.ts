export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      body_stats: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          id: number
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: number
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: number
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          muscle_group: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          muscle_group?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
        }
        Relationships: []
      }
      media_uploads: {
        Row: {
          caption: string | null
          created_at: string | null
          file_url: string | null
          id: number
          media_type: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          media_type?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: number
          media_type?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string | null
          notification_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          created_at: string | null
          exercise_name: string
          id: number
          reps: number | null
          rest_time: number | null
          session_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_name: string
          id?: number
          reps?: number | null
          rest_time?: number | null
          session_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_name?: string
          id?: number
          reps?: number | null
          rest_time?: number | null
          session_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_shares: {
        Row: {
          created_at: string | null
          id: number
          platform: string | null
          session_id: string
          share_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          platform?: string | null
          session_id: string
          share_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          platform?: string | null
          session_id?: string
          share_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_shares_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          avg_heart_rate: number | null
          created_at: string | null
          feedback: string | null
          id: number
          max_heart_rate: number | null
          session_id: string
          summary_text: string | null
          total_calories: number | null
          user_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: number
          max_heart_rate?: number | null
          session_id: string
          summary_text?: string | null
          total_calories?: number | null
          user_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: number
          max_heart_rate?: number | null
          session_id?: string
          summary_text?: string | null
          total_calories?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          duration: unknown | null
          end_time: string | null
          id: string
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: unknown | null
          end_time?: string | null
          id?: string
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration?: unknown | null
          end_time?: string | null
          id?: string
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string | null
          id: number
          plan_text: string | null
          updated_at: string | null
          user_id: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          plan_text?: string | null
          updated_at?: string | null
          user_id: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          plan_text?: string | null
          updated_at?: string | null
          user_id?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_day_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          rep_max: number | null
          rep_min: number | null
          set_count: number | null
          user_training_day_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id: string
          rep_max?: number | null
          rep_min?: number | null
          set_count?: number | null
          user_training_day_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          rep_max?: number | null
          rep_min?: number | null
          set_count?: number | null
          user_training_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_day_exercises_user_training_day_id_fkey"
            columns: ["user_training_day_id"]
            isOneToOne: false
            referencedRelation: "user_training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_sets: {
        Row: {
          completed_at: string
          created_at: string | null
          exercise_id: string | null
          id: string
          reps: number | null
          session_id: string | null
          set_number: number | null
          weight: number | null
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          exercise_id?: string | null
          id: string
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          weight?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_days: {
        Row: {
          created_at: string | null
          day_number: number | null
          estimated_duration: number | null
          id: string
          title: string | null
          user_training_plan_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          estimated_duration?: number | null
          id: string
          title?: string | null
          user_training_plan_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          estimated_duration?: number | null
          id?: string
          title?: string | null
          user_training_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_training_days_user_training_plan_id_fkey"
            columns: ["user_training_plan_id"]
            isOneToOne: false
            referencedRelation: "user_training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_plans: {
        Row: {
          base_plan_id: number
          created_at: string | null
          id: string
          name: string | null
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          base_plan_id?: number
          created_at?: string | null
          id: string
          name?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          base_plan_id?: number
          created_at?: string | null
          id?: string
          name?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_training_plans_base_plan_id_fkey"
            columns: ["base_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          password_hash: string | null
          profile_image_url: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          password_hash?: string | null
          profile_image_url?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          password_hash?: string | null
          profile_image_url?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voice_memos: {
        Row: {
          audio_file_url: string | null
          created_at: string | null
          id: number
          session_id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_file_url?: string | null
          created_at?: string | null
          id?: number
          session_id: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_file_url?: string | null
          created_at?: string | null
          id?: number
          session_id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_memos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_data: {
        Row: {
          id: number
          recorded_at: string
          sensor_type: string
          session_id: string
          user_id: string
          value: number | null
        }
        Insert: {
          id?: number
          recorded_at: string
          sensor_type: string
          session_id: string
          user_id: string
          value?: number | null
        }
        Update: {
          id?: number
          recorded_at?: string
          sensor_type?: string
          session_id?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
