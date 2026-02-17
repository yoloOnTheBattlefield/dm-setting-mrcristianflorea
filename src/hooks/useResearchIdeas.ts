import { useQuery } from "@tanstack/react-query";
import { IDEAS } from "@/lib/research-mock-data";

export function useResearchIdeas() {
  return useQuery({
    queryKey: ["research-ideas"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return IDEAS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
