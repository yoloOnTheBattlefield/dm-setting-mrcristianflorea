import { useQuery } from "@tanstack/react-query";
import { COMMENTERS } from "@/lib/research-mock-data";

export function useResearchCommenters() {
  return useQuery({
    queryKey: ["research-commenters"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return COMMENTERS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
