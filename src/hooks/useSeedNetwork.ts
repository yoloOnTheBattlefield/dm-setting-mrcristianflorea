import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface SeedNode {
  id: string;
  type: "seed";
  label: string;
  leadCount: number;
}

export interface LeadNode {
  id: string;
  type: "lead";
  label: string;
  qualified: boolean | null;
  unqualified_reason: string | null;
  followersCount: number;
  seedCount: number;
}

export type GraphNode = SeedNode | LeadNode;

export interface GraphLink {
  source: string;
  target: string;
}

export interface SeedNetworkData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    totalSeeds: number;
    totalLeads: number;
    crossConnected: number;
  };
}

export function useSeedNetwork(filters: { qualified?: string; limit?: number }) {
  return useQuery({
    queryKey: ["seed-network", filters],
    queryFn: async (): Promise<SeedNetworkData> => {
      const sp = new URLSearchParams();
      if (filters.qualified) sp.append("qualified", filters.qualified);
      if (filters.limit) sp.append("limit", String(filters.limit));
      const res = await fetchWithAuth(`${API_URL}/api/analytics/seed-network?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch seed network: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
