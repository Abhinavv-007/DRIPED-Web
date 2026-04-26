"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface ReceiptRef {
  id: string;
  user_id: string;
  subscription_id: string | null;
  email_hash: string;
  gmail_message_id: string | null;
  subject: string | null;
  sender: string | null;
  snippet: string | null;
  amount: number | null;
  currency: string | null;
  charged_at: string | null;
  created_at: string;
}

export function useReceipts(subscriptionId: string | null | undefined) {
  return useQuery({
    queryKey: ["receipts", subscriptionId],
    enabled: !!subscriptionId,
    queryFn: async () => {
      const res = await api.get<ReceiptRef[]>(`/receipts/${subscriptionId}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load receipts");
      return res.data ?? [];
    },
    staleTime: 60_000,
  });
}
