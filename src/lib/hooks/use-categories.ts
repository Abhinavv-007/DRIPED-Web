"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AppCategory } from "@/lib/models/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<AppCategory[]>("/categories");
      if (res.data && res.data.length > 0) return res.data;
      return DEFAULT_CATEGORIES;
    },
  });
}

export function useUpdateCategoryBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, budget_limit }: { id: string; budget_limit: number | null }) => {
      const res = await api.put<AppCategory>(`/categories/${id}`, { budget_limit });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
