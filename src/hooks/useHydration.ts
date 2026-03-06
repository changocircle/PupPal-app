/**
 * Hook to detect Zustand persist store hydration state.
 *
 * Zustand v5 persist middleware exposes `store.persist.hasHydrated()` (sync)
 * and `store.persist.onFinishHydration(cb)` (listener). We use both to
 * return a reactive boolean that starts `false` and flips `true` once
 * *all* provided stores have finished hydrating from AsyncStorage.
 *
 * Usage:
 *   const hydrated = useHydration(useDogStore, useTrainingStore);
 *   if (!hydrated) return <HomeSkeleton />;
 */

import { useEffect, useState } from "react";

type StoreWithPersist = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

export function useHydration(...stores: StoreWithPersist[]): boolean {
  const [hydrated, setHydrated] = useState(() =>
    stores.every((s) => s.persist.hasHydrated()),
  );

  useEffect(() => {
    // If already hydrated on mount, nothing to do
    if (hydrated) return;

    const unsubscribers: (() => void)[] = [];

    const checkAll = () => {
      if (stores.every((s) => s.persist.hasHydrated())) {
        setHydrated(true);
        // Clean up all listeners
        unsubscribers.forEach((unsub) => unsub());
      }
    };

    for (const store of stores) {
      // Already hydrated stores can be skipped
      if (store.persist.hasHydrated()) continue;

      const unsub = store.persist.onFinishHydration(() => {
        checkAll();
      });
      unsubscribers.push(unsub);
    }

    // Edge case: all stores hydrated between useState init and useEffect
    checkAll();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []); // Run only once on mount

  return hydrated;
}
