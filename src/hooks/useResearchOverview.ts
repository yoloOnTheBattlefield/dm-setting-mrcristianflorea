import { useQuery } from "@tanstack/react-query";
import {
  OVERVIEW_KPIS,
  ENGAGEMENT_TREND,
  TOP_POSTS,
} from "@/lib/research-mock-data";

export function useResearchOverviewKPIs() {
  return useQuery({
    queryKey: ["research-overview-kpis"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return OVERVIEW_KPIS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useResearchEngagementTrend() {
  return useQuery({
    queryKey: ["research-engagement-trend"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return ENGAGEMENT_TREND;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useResearchTopPosts() {
  return useQuery({
    queryKey: ["research-top-posts"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return TOP_POSTS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
