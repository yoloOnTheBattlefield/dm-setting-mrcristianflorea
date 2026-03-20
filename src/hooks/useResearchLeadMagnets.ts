import { useQuery } from "@tanstack/react-query";
import { LEAD_MAGNETS } from "@/lib/research-mock-data";

export function useResearchLeadMagnets() {
  return useQuery({
    queryKey: ["research-lead-magnets"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return LEAD_MAGNETS;
    },
    staleTime: 1000 * 60 * 5,
  });
}
