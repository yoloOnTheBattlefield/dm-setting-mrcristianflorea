import { useQuery } from "@tanstack/react-query";
import { ALERTS } from "@/lib/research-mock-data";

export function useResearchAlerts() {
  return useQuery({
    queryKey: ["research-alerts"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return ALERTS;
    },
    staleTime: 1000 * 60 * 5,
  });
}
