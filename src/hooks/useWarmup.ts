import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth, apiPost, apiPatch } from "@/lib/api";

export interface WarmupChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
}

export interface WarmupStatus {
  enabled: boolean;
  startDate: string | null;
  currentDay: number;
  todayCap: number | null;
  automationBlocked: boolean;
  schedule: { day: number; cap: number }[];
  checklist: WarmupChecklistItem[];
  checklistProgress: { completed: number; total: number };
}

export interface WarmupLog {
  _id: string;
  action: string;
  details: Record<string, unknown>;
  performedBy: string;
  createdAt: string;
}

interface WarmupLogsResponse {
  logs: WarmupLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useWarmupStatus(outboundAccountId: string | null) {
  return useQuery({
    queryKey: ["warmup", outboundAccountId],
    queryFn: async (): Promise<WarmupStatus> => {
      const res = await fetchWithAuth(`${API_URL}/api/warmup/${outboundAccountId}`);
      if (!res.ok) throw new Error(`Failed to fetch warmup status: ${res.status}`);
      return res.json();
    },
    enabled: !!outboundAccountId,
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useStartWarmup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outboundAccountId: string) =>
      apiPost(`${API_URL}/api/warmup/${outboundAccountId}/start`),
    onSuccess: (_data, outboundAccountId) => {
      queryClient.invalidateQueries({ queryKey: ["warmup", outboundAccountId] });
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useStopWarmup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outboundAccountId: string) =>
      apiPost(`${API_URL}/api/warmup/${outboundAccountId}/stop`),
    onSuccess: (_data, outboundAccountId) => {
      queryClient.invalidateQueries({ queryKey: ["warmup", outboundAccountId] });
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outboundAccountId, key }: { outboundAccountId: string; key: string }) =>
      apiPatch(`${API_URL}/api/warmup/${outboundAccountId}/checklist/${key}`, {}),
    onSuccess: (_data, { outboundAccountId }) => {
      queryClient.invalidateQueries({ queryKey: ["warmup", outboundAccountId] });
    },
  });
}

export function useWarmupLogs(
  outboundAccountId: string | null,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: ["warmup-logs", outboundAccountId, params.page, params.limit],
    queryFn: async (): Promise<WarmupLogsResponse> => {
      const sp = new URLSearchParams();
      sp.append("page", String(params.page));
      sp.append("limit", String(params.limit));
      const res = await fetchWithAuth(
        `${API_URL}/api/warmup/${outboundAccountId}/logs?${sp.toString()}`,
      );
      if (!res.ok) throw new Error(`Failed to fetch warmup logs: ${res.status}`);
      return res.json();
    },
    enabled: !!outboundAccountId,
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}
