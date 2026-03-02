import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type { ResearchCommenter } from "@/lib/research-types";

export function useResearchCommenters() {
  return useQuery({
    queryKey: ["research-commenters"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/research/commenters`,
      );
      if (!res.ok) throw new Error("Failed to fetch commenters");
      return res.json() as Promise<ResearchCommenter[]>;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
