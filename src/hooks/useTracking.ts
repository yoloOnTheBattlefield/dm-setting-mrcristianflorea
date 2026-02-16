import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/tracking"
  : "https://quddify-server.vercel.app/tracking";

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
      const res = await fetchWithAuth(`${API_URL}/settings`);
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
      const res = await fetchWithAuth(`${API_URL}/settings`, {
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

export function useTrackingEvents(limit = 5) {
  return useQuery({
    queryKey: ["tracking-events", limit],
    queryFn: async (): Promise<{ events: TrackingEvent[] }> => {
      const res = await fetchWithAuth(`${API_URL}/events?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch tracking events");
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
