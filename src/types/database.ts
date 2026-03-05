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
          age_months_at_creation: number | null;
          gender: "male" | "female" | "unknown" | null;
          weight_kg: number | null;
          size_category: "small" | "medium" | "large" | "giant" | null;
          challenges: string[];
          owner_experience: "first_time" | "some_experience" | "experienced";
          is_active: boolean;
          created_at: string;
          updated_at: string;
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
          age_months_at_creation?: number | null;
          gender?: "male" | "female" | "unknown" | null;
          weight_kg?: number | null;
          size_category?: "small" | "medium" | "large" | "giant" | null;
          challenges?: string[];
          owner_experience?: "first_time" | "some_experience" | "experienced";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dogs"]["Insert"]>;
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
export type InsertUser = Database["public"]["Tables"]["users"]["Insert"];
export type InsertDog = Database["public"]["Tables"]["dogs"]["Insert"];
export type UpdateUser = Database["public"]["Tables"]["users"]["Update"];
export type UpdateDog = Database["public"]["Tables"]["dogs"]["Update"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type OwnerExperience = Database["public"]["Enums"]["owner_experience"];
