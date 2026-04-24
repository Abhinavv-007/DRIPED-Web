"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { PaymentMethod, PaymentMethodCreateBody } from "@/lib/models/types";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await api.get<PaymentMethod[]>("/payment-methods");
      return res.data ?? [];
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PaymentMethodCreateBody) => {
      const res = await api.post<PaymentMethod>("/payment-methods", body);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<PaymentMethod> & { id: string }) => {
      const res = await api.put<PaymentMethod>(`/payment-methods/${id}`, body);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/payment-methods/${id}`);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}
