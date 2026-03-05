import { create } from "zustand";
import type { Dog } from "@/types/database";

interface DogState {
  /** All dogs belonging to the current user */
  dogs: Dog[];
  /** Currently active/selected dog */
  activeDogId: string | null;

  // Computed
  activeDog: () => Dog | null;

  // Actions
  setDogs: (dogs: Dog[]) => void;
  setActiveDog: (dogId: string) => void;
  addDog: (dog: Dog) => void;
  updateDog: (dogId: string, updates: Partial<Dog>) => void;
}

export const useDogStore = create<DogState>((set, get) => ({
  dogs: [],
  activeDogId: null,

  activeDog: () => {
    const { dogs, activeDogId } = get();
    return dogs.find((d) => d.id === activeDogId) ?? null;
  },

  setDogs: (dogs) =>
    set({
      dogs,
      // Auto-select the active dog, or first dog
      activeDogId: dogs.find((d) => d.is_active)?.id ?? dogs[0]?.id ?? null,
    }),

  setActiveDog: (dogId) => set({ activeDogId: dogId }),

  addDog: (dog) =>
    set((state) => ({
      dogs: [...state.dogs, dog],
      activeDogId: dog.is_active ? dog.id : state.activeDogId,
    })),

  updateDog: (dogId, updates) =>
    set((state) => ({
      dogs: state.dogs.map((d) => (d.id === dogId ? { ...d, ...updates } : d)),
    })),
}));
