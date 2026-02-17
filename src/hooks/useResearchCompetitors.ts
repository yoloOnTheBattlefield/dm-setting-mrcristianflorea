import { useQuery } from "@tanstack/react-query";
import { COMPETITORS } from "@/lib/research-mock-data";

export function useResearchCompetitors() {
  return useQuery({
    queryKey: ["research-competitors"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return COMPETITORS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useResearchCompetitor(id: string | undefined) {
  return useQuery({
    queryKey: ["research-competitor", id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return COMPETITORS.find((c) => c.id === id) ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
