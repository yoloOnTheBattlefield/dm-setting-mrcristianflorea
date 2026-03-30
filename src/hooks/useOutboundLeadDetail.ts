import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface OutboundLeadDetail {
  _id: string;
  account_id: string;
  followingKey: string;
  username: string;
  fullName: string | null;
  profileLink: string | null;
  isVerified: boolean | null;
  followersCount: number | null;
  bio: string | null;
  postsCount: number | null;
  externalUrl: string | null;
  email: string | null;
  source: string | null;
  scrapeDate: string | null;
  ig: string | null;
  promptId: string | null;
  promptLabel: string | null;
  isMessaged: boolean | null;
  dmDate: string | null;
  message: string | null;
  ig_thread_id: string | null;
  link_sent: boolean;
  link_sent_at: string | null;
  replied: boolean;
  replied_at: string | null;
  booked: boolean;
  booked_at: string | null;
  contract_value: number | null;
  qualified: boolean | null;
  unqualified_reason: string | null;
  score: number | null;
  ai_processed: boolean;
  ai_provider: string | null;
  ai_model: string | null;
  source_seeds: string[];
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = `${API_URL}/outbound-leads`;

export function useOutboundLeadDetail(id: string | undefined) {
  return useQuery<OutboundLeadDetail>({
    queryKey: ["outbound-lead-detail", id],
    queryFn: async () => {
      const res = await fetchWithAuth(`${BASE_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch outbound lead");
      return res.json();
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useUpdateOutboundLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetchWithAuth(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update outbound lead");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["outbound-lead-detail", vars.id] });
      qc.invalidateQueries({ queryKey: ["outbound-leads"] });
      qc.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
    },
  });
}
