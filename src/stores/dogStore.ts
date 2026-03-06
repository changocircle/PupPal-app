/**
 * Dog Store — Zustand + AsyncStorage
 * PRD-11: Multi-dog management with per-dog isolation.
 *
 * Manages the dog list, active dog selection, archive/delete,
 * and coordinates per-dog store data swaps on switch.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Dog } from "@/types/database";

// ──────────────────────────────────────────────
// Per-Dog Store Keys — used to save/restore per-dog data on switch
// ──────────────────────────────────────────────

const PER_DOG_STORE_KEYS = [
  "puppal-training",
  "puppal-gamification",
  "puppal-chat-store",
  "puppal-health",
  "puppal-journal",
] as const;

async function savePerDogData(dogId: string): Promise<void> {
  try {
    for (const key of PER_DOG_STORE_KEYS) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        await AsyncStorage.setItem(`${key}::${dogId}`, data);
      }
    }
  } catch (e) {
    console.warn("[dogStore] Failed to save per-dog data:", e);
  }
}

async function loadPerDogData(dogId: string): Promise<void> {
  try {
    for (const key of PER_DOG_STORE_KEYS) {
      const data = await AsyncStorage.getItem(`${key}::${dogId}`);
      if (data) {
        await AsyncStorage.setItem(key, data);
      } else {
        // No data for this dog yet — remove current so stores reset to defaults
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("[dogStore] Failed to load per-dog data:", e);
  }
}

async function deletePerDogData(dogId: string): Promise<void> {
  try {
    for (const key of PER_DOG_STORE_KEYS) {
      await AsyncStorage.removeItem(`${key}::${dogId}`);
    }
  } catch (e) {
    console.warn("[dogStore] Failed to delete per-dog data:", e);
  }
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

interface DogState {
  /** All dogs belonging to the current user (including archived) */
  dogs: Dog[];
  /** Currently active/selected dog ID */
  activeDogId: string | null;
  /** Whether a dog switch is in progress */
  isSwitching: boolean;

  // Computed
  activeDog: () => Dog | null;
  activeDogs: () => Dog[];
  archivedDogs: () => Dog[];
  dogCount: () => number;

  // Actions
  setDogs: (dogs: Dog[]) => void;
  setActiveDog: (dogId: string) => void;
  addDog: (dog: Dog) => void;
  updateDog: (dogId: string, updates: Partial<Dog>) => void;
  archiveDog: (dogId: string) => void;
  unarchiveDog: (dogId: string) => void;
  deleteDog: (dogId: string) => void;

  /** Switch active dog — saves current dog's state, loads new dog's state */
  switchDog: (dogId: string) => Promise<void>;

  /** Save current dog's per-dog state (call before app close or switch) */
  saveCurrentDogState: () => Promise<void>;

  /** Reset all dog data and per-dog AsyncStorage (call on sign-out) */
  resetDogs: () => void;
}

export const useDogStore = create<DogState>()(
  persist(
    (set, get) => ({
      dogs: [],
      activeDogId: null,
      isSwitching: false,

      // ─── Computed ───

      activeDog: () => {
        const { dogs, activeDogId } = get();
        return dogs.find((d) => d.id === activeDogId) ?? null;
      },

      activeDogs: () => {
        return get().dogs.filter((d) => !d.archived_at);
      },

      archivedDogs: () => {
        return get().dogs.filter((d) => d.archived_at != null);
      },

      dogCount: () => {
        return get().dogs.filter((d) => !d.archived_at).length;
      },

      // ─── Actions ───

      setDogs: (dogs) =>
        set({
          dogs,
          activeDogId:
            dogs.find((d) => d.is_active && !d.archived_at)?.id ??
            dogs.find((d) => !d.archived_at)?.id ??
            null,
        }),

      setActiveDog: (dogId) =>
        set((state) => ({
          activeDogId: dogId,
          dogs: state.dogs.map((d) => ({
            ...d,
            is_active: d.id === dogId,
          })),
        })),

      addDog: (dog) =>
        set((state) => ({
          dogs: [...state.dogs, { ...dog, is_active: false }],
        })),

      updateDog: (dogId, updates) =>
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId
              ? { ...d, ...updates, updated_at: new Date().toISOString() }
              : d
          ),
        })),

      archiveDog: (dogId) => {
        const { dogs, activeDogId } = get();
        const now = new Date().toISOString();
        const updatedDogs = dogs.map((d) =>
          d.id === dogId
            ? { ...d, archived_at: now, is_active: false, updated_at: now }
            : d
        );

        // If archiving active dog, switch to next available
        let newActiveId = activeDogId;
        if (dogId === activeDogId) {
          const nextDog = updatedDogs.find(
            (d) => d.id !== dogId && !d.archived_at
          );
          newActiveId = nextDog?.id ?? null;
          if (nextDog) {
            const idx = updatedDogs.findIndex((d) => d.id === nextDog.id);
            if (idx >= 0) updatedDogs[idx] = { ...updatedDogs[idx]!, is_active: true };
          }
        }

        set({ dogs: updatedDogs, activeDogId: newActiveId });
      },

      unarchiveDog: (dogId) =>
        set((state) => ({
          dogs: state.dogs.map((d) =>
            d.id === dogId
              ? { ...d, archived_at: null, updated_at: new Date().toISOString() }
              : d
          ),
        })),

      deleteDog: (dogId) => {
        const { dogs, activeDogId } = get();
        const remaining = dogs.filter((d) => d.id !== dogId);

        let newActiveId = activeDogId;
        if (dogId === activeDogId) {
          const nextDog = remaining.find((d) => !d.archived_at);
          newActiveId = nextDog?.id ?? null;
          if (nextDog) {
            const idx = remaining.findIndex((d) => d.id === nextDog.id);
            if (idx >= 0) remaining[idx] = { ...remaining[idx]!, is_active: true };
          }
        }

        // Clean up per-dog AsyncStorage data
        deletePerDogData(dogId).catch(() => {});

        set({ dogs: remaining, activeDogId: newActiveId });
      },

      switchDog: async (dogId) => {
        const { activeDogId, dogs } = get();
        if (dogId === activeDogId) return;

        // Don't switch to archived dogs
        const targetDog = dogs.find((d) => d.id === dogId);
        if (!targetDog || targetDog.archived_at) return;

        set({ isSwitching: true });

        try {
          // Save current dog's state
          if (activeDogId) {
            await savePerDogData(activeDogId);
          }

          // Load target dog's state
          await loadPerDogData(dogId);

          // Update active dog
          set((state) => ({
            activeDogId: dogId,
            dogs: state.dogs.map((d) => ({
              ...d,
              is_active: d.id === dogId,
            })),
            isSwitching: false,
          }));
        } catch (e) {
          console.error("[dogStore] Switch failed:", e);
          set({ isSwitching: false });
        }
      },

      saveCurrentDogState: async () => {
        const { activeDogId } = get();
        if (activeDogId) {
          await savePerDogData(activeDogId);
        }
      },

      resetDogs: () => {
        const { dogs } = get();
        // Clean up per-dog AsyncStorage data in the background
        for (const dog of dogs) {
          deletePerDogData(dog.id).catch(() => {});
        }
        set({ dogs: [], activeDogId: null, isSwitching: false });
      },
    }),
    {
      name: "puppal-dogs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dogs: state.dogs,
        activeDogId: state.activeDogId,
      }),
    }
  )
);

/**
 * Helper: get the currently active dog (non-reactive, for use outside React)
 */
export function getActiveDog(): Dog | null {
  return useDogStore.getState().activeDog();
}
