import { create } from "zustand";

interface UiState {
  /** Whether the XP animation is currently playing */
  isXpAnimating: boolean;
  /** Current XP gain to animate (0 when idle) */
  xpGainAmount: number;
  /** Whether the app is in foreground */
  isAppActive: boolean;

  // Actions
  triggerXpAnimation: (amount: number) => void;
  clearXpAnimation: () => void;
  setAppActive: (active: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isXpAnimating: false,
  xpGainAmount: 0,
  isAppActive: true,

  triggerXpAnimation: (amount) => set({ isXpAnimating: true, xpGainAmount: amount }),
  clearXpAnimation: () => set({ isXpAnimating: false, xpGainAmount: 0 }),
  setAppActive: (active) => set({ isAppActive: active }),
}));
