import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { useDogStore } from "@/stores/dogStore";
import { useAuthStore } from "@/stores/authStore";
import type { Dog, InsertDog, UpdateDog } from "@/types/database";

/**
 * Dog data hook, all dog CRUD via TanStack Query.
 * Per TECH-STACK.md: server state through TanStack Query,
 * client state (active selection) through Zustand.
 */
export function useDogs() {
  const user = useAuthStore((s) => s.user);
  const { setDogs } = useDogStore();

  return useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const dogs = (data ?? []) as Dog[];
      setDogs(dogs);
      return dogs;
    },
    enabled: !!user,
  });
}

export function useCreateDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dog: InsertDog) => {
      const { data, error } = await supabase
        .from("dogs")
        .insert(dog)
        .select()
        .single();

      if (error) throw error;
      return data as Dog;
    },
    onSuccess: (newDog) => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      useDogStore.getState().addDog(newDog);
    },
  });
}

export function useUpdateDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateDog }) => {
      const { data, error } = await supabase
        .from("dogs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Dog;
    },
    onSuccess: (updatedDog) => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      useDogStore.getState().updateDog(updatedDog.id, updatedDog);
    },
  });
}
