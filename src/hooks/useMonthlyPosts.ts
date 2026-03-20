import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { ReelComment } from "./useMonthlyReels";

export interface PostItem {
  id: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  caption: string | null;
  media_url: string | null;
  like_count: number;
  comments_count: number;
  comments: ReelComment[];
}

export interface MonthlyPostsResponse {
  month: string;
  since: string;
  ig_username: string | null;
  count: number;
  posts: PostItem[];
}

export function useMonthlyPosts(accountId: string | undefined) {
  return useQuery<MonthlyPostsResponse>({
    queryKey: ["monthly-posts", accountId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/api/instagram/posts/monthly/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch monthly posts");
      return res.json();
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  });
}
