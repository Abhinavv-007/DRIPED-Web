"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type InsightsSavings = {
  totals: {
    active_count: number;
    monthly: number;
    yearly: number;
    potential_yearly_savings: number;
  };
  ghosts: Array<{
    subscription_id: string;
    service_name: string;
    service_slug?: string;
    amount: number;
    currency: string;
    billing_cycle: string;
    last_email_detected_at: string | null;
  }>;
  duplicates: Array<{
    slug: string;
    entries: Array<{ id: string; service_name: string; amount: number; currency: string }>;
  }>;
  annual_hints: Array<{
    subscription_id: string;
    service_name: string;
    service_slug?: string;
    monthly_amount: number;
    hypothetical_yearly: number;
    estimated_savings: number;
    currency: string;
  }>;
  cancel_candidates: Array<{
    subscription_id: string;
    service_name: string;
    service_slug?: string;
    reason: "ghost" | "duplicate";
    yearly_saving: number;
    currency: string;
  }>;
};

export type InsightsForecast = {
  months: Array<{
    month: string;
    total: number;
    charges: Array<{ sub_id: string; name: string; amount: number }>;
  }>;
};

export type InsightsCalendar = {
  charges: Array<{
    date: string;
    sub_id: string;
    name: string;
    amount: number;
    currency: string;
  }>;
};

export type WhatIfResult = {
  baseline: { monthly: number; yearly: number };
  projected: { monthly: number; yearly: number };
  saving: { monthly: number; yearly: number };
  cancelled_count: number;
};

export function useSavingsInsights() {
  return useQuery({
    queryKey: ["insights", "savings"],
    queryFn: async () => {
      const res = await api.get<InsightsSavings>("/insights/savings");
      if (!res.success) throw new Error(res.error ?? "Failed to load savings");
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useForecast(months = 12) {
  return useQuery({
    queryKey: ["insights", "forecast", months],
    queryFn: async () => {
      const res = await api.get<InsightsForecast>(`/insights/forecast?months=${months}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load forecast");
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export function useCalendar(days = 90) {
  return useQuery({
    queryKey: ["insights", "calendar", days],
    queryFn: async () => {
      const res = await api.get<InsightsCalendar>(`/insights/calendar?days=${days}`);
      if (!res.success) throw new Error(res.error ?? "Failed to load calendar");
      return res.data!;
    },
    staleTime: 60_000,
  });
}

export async function runWhatIf(cancelIds: string[], months = 12): Promise<WhatIfResult> {
  const res = await api.post<WhatIfResult>("/insights/what-if", {
    cancel_subscription_ids: cancelIds,
    months_ahead: months,
  });
  if (!res.success) throw new Error(res.error ?? "What-if failed");
  return res.data!;
}
