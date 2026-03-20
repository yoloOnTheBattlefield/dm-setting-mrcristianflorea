import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface StoryItem {
  id: string;
  media_type: string;
  timestamp: string;
  permalink: string | null;
  media_url: string | null;
}

export interface StoriesResponse {
  ig_username: string | null;
  count: number;
  stories: StoryItem[];
}

export function useInstagramStories(accountId: string | undefined) {
  return useQuery<StoriesResponse>({
    queryKey: ["instagram-stories", accountId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/api/instagram/stories/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      return res.json();
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  });
}
