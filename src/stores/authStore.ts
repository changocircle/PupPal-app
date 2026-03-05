import { create } from "zustand";
import type { User } from "@/types/database";

interface AuthState {
  /** Currently authenticated user (null = not logged in) */
  user: User | null;
  /** Auth session loading state */
  isLoading: boolean;
  /** Whether user has completed onboarding */
  hasCompletedOnboarding: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  setUser: (user) =>
    set({
      user,
      hasCompletedOnboarding: user?.onboarding_completed ?? false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
  signOut: () => set({ user: null, hasCompletedOnboarding: false }),
}));
