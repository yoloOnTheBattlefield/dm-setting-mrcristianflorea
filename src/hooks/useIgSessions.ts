import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth, apiPost, apiDelete } from "@/lib/api";

export interface IgSessionProfile {
  ig_username: string;
  has_cookies: boolean;
  added_at: string | null;
}

export function useIgSessions() {
  return useQuery({
    queryKey: ["ig-sessions"],
    queryFn: async (): Promise<{ ig_sessions: IgSessionProfile[] }> => {
      const res = await fetchWithAuth(`${API_URL}/accounts/ig-sessions`);
      if (!res.ok) throw new Error(`Failed to fetch IG sessions: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useAddIgSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ig_username: string; cookies: unknown[] }) =>
      apiPost(`${API_URL}/accounts/ig-sessions`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ig-sessions"] });
    },
  });
}

export function useRemoveIgSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiDelete(`${API_URL}/accounts/ig-sessions/${encodeURIComponent(username)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ig-sessions"] });
    },
  });
}
