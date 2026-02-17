import { useQuery } from "@tanstack/react-query";
import { POSTS } from "@/lib/research-mock-data";
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
      await new Promise((r) => setTimeout(r, 300));

      let filtered = [...POSTS];

      if (params.competitorId) {
        filtered = filtered.filter((p) => p.competitorId === params.competitorId);
      }
      if (params.postType) {
        filtered = filtered.filter((p) => p.postType === params.postType);
      }
      if (params.topicTag) {
        filtered = filtered.filter((p) => p.topicTags.includes(params.topicTag!));
      }
      if (params.hookStyle) {
        filtered = filtered.filter((p) => p.hookStyle === params.hookStyle);
      }
      if (params.ctaType) {
        filtered = filtered.filter((p) => p.ctaType === params.ctaType);
      }
      if (params.hasLeadMagnet !== undefined) {
        filtered = filtered.filter((p) => p.hasLeadMagnetKeyword === params.hasLeadMagnet);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.caption.toLowerCase().includes(q) ||
            p.competitorHandle.toLowerCase().includes(q),
        );
      }

      // Sort
      switch (params.sortBy) {
        case "comments":
          filtered.sort((a, b) => b.commentsCount - a.commentsCount);
          break;
        case "keyword_repetition":
          filtered.sort((a, b) => {
            const aMax = Math.max(...a.keywordDistribution.filter((k) => k.keyword !== "other").map((k) => k.count), 0);
            const bMax = Math.max(...b.keywordDistribution.filter((k) => k.keyword !== "other").map((k) => k.count), 0);
            return bMax - aMax;
          });
          break;
        case "newest":
        default:
          filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
          break;
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / params.limit);
      const start = (params.page - 1) * params.limit;
      const posts = filtered.slice(start, start + params.limit);

      return { posts, total, totalPages, page: params.page };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
