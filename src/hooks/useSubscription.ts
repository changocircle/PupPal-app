import { useAuthStore } from "@/stores/authStore";
import type { SubscriptionStatus } from "@/types/database";

/**
 * Subscription hook — THE ONLY WAY to check premium access.
 * Per PRD-07: Never check subscription status directly.
 * Always use this hook.
 *
 * In production: this will integrate with RevenueCat.
 * For now: reads from user profile in database.
 */
export function useSubscription() {
  const user = useAuthStore((s) => s.user);
  const status: SubscriptionStatus = user?.subscription_status ?? "free";

  const isPremium = status === "active" || status === "trial";
  const isTrial = status === "trial";
  const isExpired = status === "expired";

  // Check if a specific feature is available
  const hasAccess = (feature: string): boolean => {
    // Free features always available
    const FREE_FEATURES = [
      "onboarding",
      "week1_training",
      "basic_chat", // 3 messages/day
      "basic_health",
      "profile",
    ];

    if (FREE_FEATURES.includes(feature)) return true;
    return isPremium;
  };

  return {
    status,
    isPremium,
    isTrial,
    isExpired,
    hasAccess,
    // Trial info
    trialStartDate: user?.trial_start_date,
    trialEndDate: user?.trial_end_date,
  };
}
