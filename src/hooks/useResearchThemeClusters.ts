import { useQuery } from "@tanstack/react-query";
import { THEME_CLUSTERS } from "@/lib/research-mock-data";

export function useResearchThemeClusters() {
  return useQuery({
    queryKey: ["research-theme-clusters"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return THEME_CLUSTERS;
    },
    staleTime: 1000 * 60 * 5,
  });
}
