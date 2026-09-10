import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, apiGet, apiPost } from "@/lib/api";

export interface ContentPost {
  media_id: string;
  permalink: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  media_product_type: string | null;
  posted_at: string | null;
  /** Insight metrics are null when the Graph API wouldn't serve them. */
  views: number | null;
  reach: number | null;
  likes: number;
  comments: number;
  shares: number | null;
  saved: number | null;
  total_interactions: number | null;
  insights_error: string | null;
  fetched_at: string | null;
  comments_matched: number;
  dms_sent: number;
  leads_generated: number;
  leads_per_1k_views: number | null;
}

export interface ContentTotals {
  posts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saved: number;
  leads_generated: number;
}

const BASE = `${API_URL}/api/content-analytics`;

export function useContentAnalytics(days = 90) {
  return useQuery({
    queryKey: ["content-analytics", days],
    queryFn: () =>
      apiGet<{ posts: ContentPost[]; totals: ContentTotals; days: number }>(
        `${BASE}?days=${days}`,
      ),
  });
}

export function useSyncContentAnalytics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: number) =>
      apiPost<{ synced: number; with_insights: number }>(`${BASE}/sync`, { days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-analytics"] }),
  });
}
