import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types/database";

/**
 * Auth hook — manages session state and routing protection.
 *
 * Uses Supabase auth state listener to keep store in sync.
 * Handles redirect logic:
 * - No session → onboarding
 * - Session + not onboarded → onboarding
 * - Session + onboarded → tabs
 */
export function useAuth() {
  const { user, isLoading, hasCompletedOnboarding, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch full user profile from public.users
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser(profile as User | null);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "(onboarding)";
    const inTabs = segments[0] === "(tabs)";

    if (!user && !inOnboarding) {
      // Not logged in, send to onboarding
      router.replace("/(onboarding)");
    } else if (user && !hasCompletedOnboarding && !inOnboarding) {
      // Logged in but hasn't completed onboarding
      router.replace("/(onboarding)");
    } else if (user && hasCompletedOnboarding && inOnboarding) {
      // Logged in and onboarded, send to tabs
      router.replace("/(tabs)");
    }
  }, [user, isLoading, hasCompletedOnboarding, segments, router]);

  return { user, isLoading, hasCompletedOnboarding };
}
