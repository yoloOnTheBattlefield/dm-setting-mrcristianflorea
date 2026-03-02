import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type { PostSortBy, ResearchPost } from "@/lib/research-types";

interface PostFilters {
  competitorId?: string;
  postType?: string;
  topicTag?: string;
  hookStyle?: string;
  ctaType?: string;
  hasLeadMagnet?: boolean;
  search?: string;
  sortBy?: PostSortBy;
  page: number;
  limit: number;
}

interface PaginatedPosts {
  posts: ResearchPost[];
  total: number;
  totalPages: number;
  page: number;
}

export function useResearchPosts(params: PostFilters) {
  return useQuery<PaginatedPosts>({
    queryKey: ["research-posts", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.competitorId) sp.append("competitor", params.competitorId);
      if (params.postType) sp.append("post_type", params.postType);
      if (params.search) sp.append("search", params.search.trim());
      if (params.sortBy) {
        const sortMap: Record<string, string> = {
          newest: "newest",
          comments: "most_comments",
          keyword_repetition: "newest",
        };
        sp.append("sort_by", sortMap[params.sortBy] || "newest");
      }
      sp.append("page", String(params.page));
      sp.append("limit", String(params.limit));

      const res = await fetchWithAuth(
        `${API_URL}/api/research/posts?${sp.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch research posts");
      return res.json() as Promise<PaginatedPosts>;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
