/**
 * useFeatureGate, PRD-07 §4
 *
 * Programmatic gating hook for checking feature access and
 * triggering paywalls. Handles chat limits, week access,
 * multi-dog, and all other premium gates.
 *
 * Usage:
 *   const { checkAccess, isPremium, showPaywall } = useFeatureGate();
 *   const allowed = await checkAccess('chat_message');
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useSubscription } from './useSubscription';
import { useDogStore } from '@/stores/dogStore';
import { useChatStore } from '@/stores/chatStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { canShowGate, recordGateShown } from '@/lib/gateThrottle';
import { FREE_MESSAGE_LIMIT } from '@/types/chat';

/** All gate trigger names matching Superwall config (PRD-06 §3) */
export type GateTrigger =
  | 'onboarding_complete'
  | 'feature_gate_week2'
  | 'feature_gate_chat'
  | 'feature_gate_health'
  | 'feature_gate_tricks'
  | 'feature_gate_multi_dog'
  | 'feature_gate_journal'
  | 'feature_gate_community'
  | 'streak_milestone_7'
  | 'plan_week1_complete'
  | 'buddy_upsell'
  | 'settings_upgrade';

export interface GateResult {
  /** Whether the user has access to the feature */
  allowed: boolean;
  /** The reason access was denied (if denied) */
  reason?: 'premium_required' | 'limit_reached' | 'throttled';
  /** Gate trigger name for paywall */
  trigger?: GateTrigger;
  /** Extra context (e.g., messages remaining) */
  context?: Record<string, unknown>;
}

export function useFeatureGate() {
  const { isPremium, isTrial } = useSubscription();
  const router = useRouter();

  /**
   * Check if the user can access a feature.
   * Returns immediately for premium users.
   * For free users, checks specific limits and throttles.
   */
  const checkAccess = useCallback(
    async (
      feature: string,
      options?: { silent?: boolean; isCelebration?: boolean }
    ): Promise<GateResult> => {
      // Premium users always have access
      if (isPremium) {
        return { allowed: true };
      }

      // Feature-specific checks
      switch (feature) {
        case 'chat_message': {
          const store = useChatStore.getState();
          const count = store.dailyCount?.messagesSent ?? 0;
          const limit = store.dailyCount?.messagesLimit ?? FREE_MESSAGE_LIMIT;
          if (count < limit) {
            return {
              allowed: true,
              context: {
                messagesUsed: count,
                messagesLimit: limit,
                messagesRemaining: limit - count,
              },
            };
          }
          return {
            allowed: false,
            reason: 'limit_reached',
            trigger: 'feature_gate_chat',
            context: {
              messagesUsed: count,
              messagesLimit: limit,
              messagesRemaining: 0,
            },
          };
        }

        case 'week_content': {
          const plan = useTrainingStore.getState().plan;
          const currentWeek = plan?.currentWeek ?? 1;
          if (currentWeek <= 1) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_week2',
            context: { weekNumber: currentWeek },
          };
        }

        case 'exercise_access': {
          // Allow Week 1 exercises for free users; gate Week 2+
          const weekNumber = (options as any)?.weekNumber
            ?? useTrainingStore.getState().plan?.currentWeek
            ?? 1;
          if (weekNumber <= 1) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_week2',
            context: { weekNumber },
          };
        }

        case 'add_dog': {
          const dogCount = useDogStore.getState().activeDogs().length;
          if (dogCount < 1) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_multi_dog',
            context: { currentDogCount: dogCount },
          };
        }

        case 'full_health': {
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_health',
          };
        }

        case 'tricks': {
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_tricks',
          };
        }

        case 'journal_add': {
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_journal',
          };
        }

        case 'community_post': {
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'feature_gate_community',
          };
        }

        default: {
          // Unknown feature → gate it
          return {
            allowed: false,
            reason: 'premium_required',
            trigger: 'settings_upgrade',
          };
        }
      }
    },
    [isPremium]
  );

  /**
   * Show the paywall for a specific trigger.
   * Respects throttling rules (1 per session, 4hr cooldown).
   * Falls back to native paywall if Superwall unavailable.
   */
  const showPaywall = useCallback(
    async (
      trigger: GateTrigger,
      options?: { isCelebration?: boolean; isManual?: boolean }
    ): Promise<'shown' | 'throttled' | 'premium'> => {
      if (isPremium) return 'premium';

      const canShow = await canShowGate(trigger, options);
      if (!canShow) return 'throttled';

      await recordGateShown(trigger);

      // Navigate to fallback paywall (native UI)
      // In production, this would call Superwall.register(trigger) first,
      // falling back to native paywall if Superwall fails.
      router.push({
        pathname: '/paywall',
        params: { trigger, source: trigger },
      });

      return 'shown';
    },
    [isPremium, router]
  );

  /**
   * Quick check + show paywall in one call.
   * Returns true if access granted, false if gated.
   */
  const gateOrAllow = useCallback(
    async (
      feature: string,
      options?: { silent?: boolean; isCelebration?: boolean }
    ): Promise<boolean> => {
      const result = await checkAccess(feature, options);
      if (result.allowed) return true;

      if (!options?.silent && result.trigger) {
        await showPaywall(result.trigger, options);
      }

      return false;
    },
    [checkAccess, showPaywall]
  );

  return {
    isPremium,
    isTrial,
    checkAccess,
    showPaywall,
    gateOrAllow,
  };
}
