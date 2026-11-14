import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, apiGet, apiPatch } from "@/lib/api";
import type { AgentStage, ApiLead, LeadMagnetStatus } from "@/lib/types";

const BASE = `${API_URL}/api/agent`;

export interface AgentStats {
  stages: Partial<Record<AgentStage, number>>;
  lead_magnets: Partial<Record<LeadMagnetStatus, number>>;
}

export function useAgentStats() {
  return useQuery({
    queryKey: ["agent", "stats"],
    queryFn: () => apiGet<AgentStats>(`${BASE}/stats`),
  });
}

export function useLeadMagnetQueue(statuses: LeadMagnetStatus[] = ["posted", "building"]) {
  return useQuery({
    queryKey: ["agent", "lead-magnets", statuses.join(",")],
    queryFn: () =>
      apiGet<{ contacts: ApiLead[] }>(`${BASE}/lead-magnets?status=${statuses.join(",")}`),
  });
}

export function useUpdateAgentContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, patch }: { ref: string; patch: Partial<ApiLead> }) =>
      apiPatch<unknown>(`${BASE}/contacts/${encodeURIComponent(ref)}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
      qc.invalidateQueries({ queryKey: ["rawLeads"] });
    },
  });
}
