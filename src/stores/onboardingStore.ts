import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OnboardingData } from "@/types/models";

interface OnboardingState {
  /** Current step index (0-7) */
  currentStep: number;
  /** Collected onboarding data */
  data: OnboardingData;
  /** Whether onboarding is in progress */
  isActive: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const INITIAL_DATA: OnboardingData = {
  puppyName: "",
  photoUri: null,
  allPhotoUris: [],
  breed: null,
  breedConfidence: null,
  breedDetected: false,
  breedMix1: null,
  breedMix2: null,
  dateOfBirth: null,
  ageMonths: null,
  challenges: [],
  ownerExperience: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: { ...INITIAL_DATA },
      isActive: false,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      updateData: (partial) =>
        set((state) => ({
          data: { ...state.data, ...partial },
        })),
      reset: () => set({ currentStep: 0, data: { ...INITIAL_DATA }, isActive: false }),
    }),
    {
      name: "puppal-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
