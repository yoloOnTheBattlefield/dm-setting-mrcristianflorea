import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type {
  ResearchOverviewKPIs,
  EngagementTrendPoint,
} from "@/lib/research-types";

export function useResearchOverviewKPIs() {
  return useQuery({
    queryKey: ["research-overview-kpis"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/overview-kpis`,
      );
      if (!res.ok) throw new Error("Failed to fetch overview KPIs");
      return res.json() as Promise<ResearchOverviewKPIs>;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useResearchEngagementTrend() {
  return useQuery({
    queryKey: ["research-engagement-trend"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/engagement-trend`,
      );
      if (!res.ok) throw new Error("Failed to fetch engagement trend");
      return res.json() as Promise<EngagementTrendPoint[]>;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useResearchTopPosts() {
  return useQuery({
    queryKey: ["research-top-posts"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/top-posts`,
      );
      if (!res.ok) throw new Error("Failed to fetch top posts");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
