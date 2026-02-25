import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
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
    refetchOnWindowFocus: false,
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
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useAddApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { label?: string; token: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useUpdateApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      label?: string;
      status?: string;
      token?: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useDeleteApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useResetApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/apify-tokens/${id}/reset`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}
