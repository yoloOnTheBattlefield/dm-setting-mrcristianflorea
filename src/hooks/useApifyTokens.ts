import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { ApifyToken } from "@/lib/types";

export interface ApifyTokenUsage {
  _id: string;
  totalUsageUsd?: number | null;
  usageCycle?: { startAt: string; endAt: string } | null;
  monthlyUsageLimitUsd?: number | null;
  error?: string;
}

export function useApifyUsage(enabled: boolean) {
  return useQuery({
    queryKey: ["apify-tokens-usage"],
    queryFn: async (): Promise<{ usage: ApifyTokenUsage[] }> => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens/usage`);
      if (!res.ok) throw new Error(`Failed to fetch usage: ${res.status}`);
      return res.json();
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApifyTokens() {
  return useQuery({
    queryKey: ["apify-tokens"],
    queryFn: async (): Promise<{ tokens: ApifyToken[] }> => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens`);
      if (!res.ok) throw new Error(`Failed to fetch Apify tokens: ${res.status}`);
      return res.json();
    },
  });
}

export function useAddApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label?: string; token: string }) =>
      apiPost(`${API_URL}/api/apify-tokens`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useUpdateApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; label?: string; status?: string; token?: string }) =>
      apiPatch(`${API_URL}/api/apify-tokens/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useDeleteApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`${API_URL}/api/apify-tokens/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useResetApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/apify-tokens/${id}/reset`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}
