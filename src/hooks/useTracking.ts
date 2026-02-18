import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface TrackingSettings {
  tracking_enabled: boolean;
  tracking_conversion_rules: string[];
}

export interface TrackingEvent {
  _id: string;
  account_id: string;
  lead_id: string;
  event_type: "first_visit" | "page_view" | "conversion";
  url: string | null;
  referrer: string | null;
  user_agent: string | null;
  createdAt: string;
}

export function useTrackingSettings() {
  return useQuery({
    queryKey: ["tracking-settings"],
    queryFn: async (): Promise<TrackingSettings> => {
      const res = await fetchWithAuth(`${API_URL}/tracking/settings`);
      if (!res.ok) throw new Error("Failed to fetch tracking settings");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateTrackingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<TrackingSettings>): Promise<TrackingSettings> => {
      const res = await fetchWithAuth(`${API_URL}/tracking/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update tracking settings");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tracking-settings"], data);
    },
  });
}

export function useTrackingEvents(limit = 5, accountId?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (accountId) params.set("account_id", accountId);

  return useQuery({
    queryKey: ["tracking-events", limit, accountId ?? "mine"],
    queryFn: async (): Promise<{ events: TrackingEvent[] }> => {
      const res = await fetchWithAuth(`${API_URL}/tracking/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tracking events");
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useClientTrackingEvents(accountId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ["tracking-events", "client", accountId, limit],
    queryFn: async (): Promise<{ events: TrackingEvent[] }> => {
      const res = await fetchWithAuth(
        `${API_URL}/tracking/events?account_id=${accountId}&limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch client tracking events");
      return res.json();
    },
    enabled: !!accountId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
