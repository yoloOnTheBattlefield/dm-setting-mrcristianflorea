import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface ReelComment {
  id: string;
  text: string;
  timestamp: string;
  username: string;
}

export interface ReelItem {
  id: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  play_count: number;
  comments: ReelComment[];
}

export interface MonthlyReelsResponse {
  days: number;
  since: string;
  ig_username: string | null;
  count: number;
  reels: ReelItem[];
}

export function useMonthlyReels(clientId: string | undefined, days = 30) {
  return useQuery<MonthlyReelsResponse>({
    queryKey: ["monthly-reels", clientId, days],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/api/instagram/reels/monthly/${clientId}?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch monthly reels");
      return res.json();
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
