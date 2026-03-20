import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface ReelItem {
  id: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  play_count: number;
}

export interface MonthlyReelsResponse {
  month: string;
  since: string;
  ig_username: string | null;
  count: number;
  reels: ReelItem[];
}

export function useMonthlyReels(clientId: string | undefined) {
  return useQuery<MonthlyReelsResponse>({
    queryKey: ["monthly-reels", clientId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/api/instagram/reels/monthly/${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch monthly reels");
      return res.json();
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
