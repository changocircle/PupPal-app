/**
 * Dog data hooks.
 *
 * Local-first: all reads come from the Zustand store (instant).
 * Sync happens in the background via useDogSync.
 *
 * useDogs() - reactive dog list + sync status
 * useCreateDog() - create a dog locally (sync pushes it)
 * useUpdateDog() - update a dog locally (sync pushes it)
 */

import { useDogStore } from "@/stores/dogStore";
import { useAuthStore } from "@/stores/authStore";
import type { Dog, UpdateDog } from "@/types/database";

/**
 * Reactive dog list with sync status.
 * Replaces the old TanStack Query-based fetch with local-first reads.
 */
export function useDogs() {
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const syncMeta = useDogStore((s) => s._syncMeta);

  return {
    dogs,
    activeDogId,
    syncStatus: syncMeta.status,
    lastSyncedAt: syncMeta.lastSyncedAt,
    pendingCount: syncMeta.pendingCount,
    isLoading: syncMeta.status === "syncing",
  };
}

/**
 * Create a new dog. Writes to local store immediately.
 * The sync layer detects the addition and pushes to Supabase.
 */
export function useCreateDog() {
  const addDog = useDogStore((s) => s.addDog);
  const user = useAuthStore((s) => s.user);

  return {
    mutate: (dog: Omit<Dog, "user_id"> & { user_id?: string }) => {
      addDog({
        ...dog,
        user_id: user?.id ?? "local",
      } as Dog);
    },
  };
}

/**
 * Update an existing dog. Writes to local store immediately.
 * The sync layer detects the change and pushes to Supabase.
 */
export function useUpdateDog() {
  const updateDog = useDogStore((s) => s.updateDog);

  return {
    mutate: ({ id, updates }: { id: string; updates: UpdateDog }) => {
      updateDog(id, updates);
    },
  };
}
