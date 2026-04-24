"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { PaymentHistoryEntry } from "@/lib/models/types";

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payment-history"],
    queryFn: async () => {
      const res = await api.get<PaymentHistoryEntry[]>("/payment-history");
      return res.data ?? [];
    },
  });
}
