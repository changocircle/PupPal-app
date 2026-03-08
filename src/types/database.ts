/**
 * Supabase Database Types
 *
 * This file will be auto-generated via:
 *   supabase gen types typescript --local > src/types/database.ts
 *
 * For now, manually maintained until Supabase project is created.
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          photo_url: string | null;
          subscription_status: "free" | "trial" | "active" | "expired" | "cancelled";
          subscription_product_id: string | null;
          trial_start_date: string | null;
          trial_end_date: string | null;
          referral_code: string | null;
          referred_by: string | null;
          onboarding_completed: boolean;
          notification_preferences: Record<string, boolean>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          subscription_status?: "free" | "trial" | "active" | "expired" | "cancelled";
          subscription_product_id?: string | null;
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Record<string, boolean>;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      dogs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          breed: string | null;
          breed_detected: boolean;
          breed_confidence: number | null;
          photo_url: string | null;
          date_of_birth: string | null;
          gotcha_date: string | null;
          age_months_at_creation: number | null;
          gender: "male" | "female" | "unknown" | null;
          weight_kg: number | null;
          size_category: "small" | "medium" | "large" | "giant" | null;
          challenges: string[];
          owner_experience: "first_time" | "some_experience" | "experienced";
          is_active: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          breed?: string | null;
          breed_detected?: boolean;
          breed_confidence?: number | null;
          photo_url?: string | null;
          date_of_birth?: string | null;
          gotcha_date?: string | null;
          age_months_at_creation?: number | null;
          gender?: "male" | "female" | "unknown" | null;
          weight_kg?: number | null;
          size_category?: "small" | "medium" | "large" | "giant" | null;
          challenges?: string[];
          owner_experience?: "first_time" | "some_experience" | "experienced";
          is_active?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dogs"]["Insert"]>;
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          dog_id: string;
          dog_name: string;
          breed: string | null;
          status: "active" | "completed" | "paused";
          current_week: number;
          current_day: number;
          total_weeks: number;
          plan_data: unknown; // JSONB - PlanWeek[]
          total_xp: number;
          streak: number;
          last_completion_date: string | null;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dog_id: string;
          dog_name: string;
          breed?: string | null;
          status?: "active" | "completed" | "paused";
          current_week?: number;
          current_day?: number;
          total_weeks?: number;
          plan_data: unknown;
          total_xp?: number;
          streak?: number;
          last_completion_date?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_plans"]["Insert"]>;
      };
      exercise_completions: {
        Row: {
          id: string;
          user_id: string;
          dog_id: string;
          plan_id: string;
          exercise_id: string;
          plan_exercise_id: string;
          completed_at: string;
          rating: number | null;
          xp_earned: number;
          time_spent_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          dog_id: string;
          plan_id: string;
          exercise_id: string;
          plan_exercise_id: string;
          completed_at: string;
          rating?: number | null;
          xp_earned?: number;
          time_spent_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_completions"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_status: "free" | "trial" | "active" | "expired" | "cancelled";
      owner_experience: "first_time" | "some_experience" | "experienced";
      gender: "male" | "female" | "unknown";
      size_category: "small" | "medium" | "large" | "giant";
    };
  };
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Dog = Database["public"]["Tables"]["dogs"]["Row"];
export type TrainingPlanRow = Database["public"]["Tables"]["training_plans"]["Row"];
export type ExerciseCompletionRow = Database["public"]["Tables"]["exercise_completions"]["Row"];
export type InsertUser = Database["public"]["Tables"]["users"]["Insert"];
export type InsertDog = Database["public"]["Tables"]["dogs"]["Insert"];
export type InsertTrainingPlan = Database["public"]["Tables"]["training_plans"]["Insert"];
export type InsertExerciseCompletion = Database["public"]["Tables"]["exercise_completions"]["Insert"];
export type UpdateUser = Database["public"]["Tables"]["users"]["Update"];
export type UpdateDog = Database["public"]["Tables"]["dogs"]["Update"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type OwnerExperience = Database["public"]["Enums"]["owner_experience"];
