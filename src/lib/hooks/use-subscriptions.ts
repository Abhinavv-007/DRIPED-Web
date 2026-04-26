"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Subscription, SubscriptionCreateBody } from "@/lib/models/types";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await api.get<Subscription[]>("/subscriptions");
      if (!res.success) throw new Error(res.error ?? "Failed to load subscriptions");
      return res.data ?? [];
    },
  });
}

export function useSubscription(id: string) {
  const { data: all } = useSubscriptions();
  return all?.find((s) => s.id === id) ?? null;
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SubscriptionCreateBody) => {
      const res = await api.post<Subscription>("/subscriptions", body);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Subscription> & { id: string }) => {
      const res = await api.put<Subscription>(`/subscriptions/${id}`, body);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/subscriptions/${id}`);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
