/**
 * Centralized store reset — call on sign-out or fresh onboarding start.
 *
 * Resets every Zustand store that uses AsyncStorage persistence,
 * clearing both in-memory state and the persisted copies.
 */

import { useChatStore } from "@/stores/chatStore";
import { useDogStore } from "@/stores/dogStore";
import { useGamificationStore } from "@/stores/gamificationStore";
import { useHealthStore } from "@/stores/healthStore";
import { useJournalStore } from "@/stores/journalStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useReferralStore } from "@/stores/referralStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useTrickStore } from "@/stores/trickStore";

export function resetAllStores(): void {
  // Reset dog store first — it also cleans up per-dog AsyncStorage keys
  useDogStore.getState().resetDogs();

  // Reset every other persisted store
  useChatStore.getState().clearConversation();
  useGamificationStore.getState().resetGamification();
  useHealthStore.getState().resetHealth();
  useJournalStore.getState().resetJournal();
  useOnboardingStore.getState().reset();
  useReferralStore.getState().resetReferral();
  useSettingsStore.getState().resetSettings();
  useTrainingStore.getState().resetPlan();
  useTrickStore.getState().resetProgress();
}
