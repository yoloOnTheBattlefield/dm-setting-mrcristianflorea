import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type { ResearchCompetitor } from "@/lib/research-types";

export function useResearchCompetitors() {
  return useQuery({
    queryKey: ["research-competitors"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/competitors`,
      );
      if (!res.ok) throw new Error("Failed to fetch competitors");
      return res.json() as Promise<ResearchCompetitor[]>;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useResearchCompetitor(id: string | undefined) {
  return useQuery({
    queryKey: ["research-competitor", id],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/competitors/${id}`,
      );
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch competitor");
      }
      return res.json() as Promise<ResearchCompetitor>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
