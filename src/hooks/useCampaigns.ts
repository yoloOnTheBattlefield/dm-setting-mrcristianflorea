import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface CampaignSchedule {
  active_hours_start: number;
  active_hours_end: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  timezone: string;
}

export interface CampaignStats {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface Campaign {
  _id: string;
  account_id: string;
  name: string;
  mode: "auto" | "manual";
  status: "draft" | "active" | "paused" | "completed";
  messages: string[];
  outbound_account_ids: string[];
  schedule: CampaignSchedule;
  daily_limit_per_sender: number;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignLead {
  _id: string;
  campaign_id: string;
  outbound_lead_id: {
    _id: string;
    username: string;
    fullName: string;
    bio?: string;
    followersCount?: number;
    profileLink?: string;
  } | null;
  sender_id: {
    _id: string;
    ig_username: string;
    display_name: string | null;
  } | null;
  status: "pending" | "queued" | "sent" | "failed" | "skipped";
  sent_at: string | null;
  message_used: string | null;
  template_index: number | null;
  task_id: string | null;
  error: string | null;
  createdAt: string;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface CampaignLeadsResponse {
  leads: CampaignLead[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// --- Queries ---

export function useCampaigns(
  params: { status?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["campaigns", params.status, params.page, params.limit],
    queryFn: async (): Promise<CampaignsResponse> => {
      const sp = new URLSearchParams();
      if (params.status) sp.append("status", params.status);
      if (params.page) sp.append("page", String(params.page));
      if (params.limit) sp.append("limit", String(params.limit));
      const res = await fetchWithAuth(`${API_URL}/api/campaigns?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useCampaign(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async (): Promise<Campaign> => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error(`Failed to fetch campaign: ${res.status}`);
      return res.json();
    },
    enabled: !!campaignId,
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useCampaignStats(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-stats", campaignId],
    queryFn: async (): Promise<CampaignStats> => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/stats`);
      if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
      return res.json();
    },
    enabled: !!campaignId,
    refetchInterval: 10_000,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCampaignLeads(
  campaignId: string | null,
  params: { status?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["campaign-leads", campaignId, params.status, params.page, params.limit],
    queryFn: async (): Promise<CampaignLeadsResponse> => {
      const sp = new URLSearchParams();
      if (params.status) sp.append("status", params.status);
      if (params.page) sp.append("page", String(params.page));
      if (params.limit) sp.append("limit", String(params.limit));
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch leads: ${res.status}`);
      return res.json();
    },
    enabled: !!campaignId,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });
}

// --- Mutations ---

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      mode?: "auto" | "manual";
      messages?: string[];
      outbound_account_ids?: string[];
      schedule?: Partial<CampaignSchedule>;
      daily_limit_per_sender?: number;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: {
      id: string;
      body: {
        name?: string;
        mode?: "auto" | "manual";
        messages?: string[];
        outbound_account_ids?: string[];
        schedule?: Partial<CampaignSchedule>;
        daily_limit_per_sender?: number;
      };
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useStartCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${id}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function useAddCampaignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, lead_ids }: { campaignId: string; lead_ids: string[] }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
      qc.invalidateQueries({ queryKey: ["campaign-leads"] });
      qc.invalidateQueries({ queryKey: ["campaign-stats"] });
    },
  });
}

export function useRemoveCampaignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
      qc.invalidateQueries({ queryKey: ["campaign-leads"] });
      qc.invalidateQueries({ queryKey: ["campaign-stats"] });
    },
  });
}
