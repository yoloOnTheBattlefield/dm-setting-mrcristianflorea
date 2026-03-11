import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface CampaignSchedule {
  active_hours_start: number;
  active_hours_end: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  timezone: string;
  burst_enabled: boolean;
  messages_per_group: number;
  min_group_break_seconds: number;
  max_group_break_seconds: number;
  skip_wait_time: boolean;
  skip_active_hours: boolean;
}

export interface CampaignStats {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  delivered: number;
  replied: number;
  link_sent: number;
  booked: number;
  failed: number;
  skipped: number;
  without_message: number;
}

export interface CampaignAIPersonalization {
  enabled: boolean;
  prompt: string | null;
  status: "idle" | "generating" | "completed" | "failed";
  progress: number;
  total: number;
  error: string | null;
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
  warmup_days?: number;
  warmup_start_date?: string | null;
  stats: CampaignStats;
  ai_personalization?: CampaignAIPersonalization;
  last_sent_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignNextSend {
  status: string;
  next_send_at: string | null;
  delay_seconds: number | null;
  last_sent_at: string | null;
  within_active_hours?: boolean;
  online_senders?: number;
  total_senders?: number;
  pending_leads?: number;
  reason: string | null;
  burst_enabled?: boolean;
  burst_on_break?: boolean;
  burst_break_remaining?: number | null;
  burst_sent_in_group?: number;
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
    link_sent?: boolean;
    replied?: boolean;
    booked?: boolean;
  } | null;
  sender_id: {
    _id: string;
    ig_username: string;
    display_name: string | null;
  } | null;
  status: "pending" | "queued" | "sent" | "delivered" | "replied" | "failed" | "skipped";
  sent_at: string | null;
  message_used: string | null;
  template_index: number | null;
  task_id: string | null;
  error: string | null;
  manually_overridden?: boolean;
  custom_message?: string | null;
  ai_provider?: string | null;
  createdAt: string;
}

export interface CampaignSender {
  _id: string | null;
  ig_username: string;
  display_name: string | null;
  status: "online" | "offline" | "restricted";
  last_seen: string | null;
  daily_limit: number;
  sent_today: number;
  failed_total: number;
  health: "good" | "warning" | "risk";
  issue: string | null;
  outbound_account: {
    _id: string;
    username: string;
    status: string;
    streak_rest_until: string | null;
  } | null;
}

export interface CampaignSendersResponse {
  senders: CampaignSender[];
  summary: {
    total: number;
    online: number;
    offline: number;
    issues: number;
  };
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

export function useCampaignNextSend(campaignId: string | null, campaignStatus?: string) {
  return useQuery({
    queryKey: ["campaign-next-send", campaignId],
    queryFn: async (): Promise<CampaignNextSend> => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/next-send`);
      if (!res.ok) throw new Error(`Failed to fetch next send: ${res.status}`);
      return res.json();
    },
    enabled: !!campaignId && campaignStatus === "active",
    refetchInterval: 10_000,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCampaignLeads(
  campaignId: string | null,
  params: { status?: string; search?: string; sender_id?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["campaign-leads", campaignId, params.status, params.search, params.sender_id, params.page, params.limit],
    queryFn: async (): Promise<CampaignLeadsResponse> => {
      const sp = new URLSearchParams();
      if (params.status) sp.append("status", params.status);
      if (params.search) sp.append("search", params.search);
      if (params.sender_id) sp.append("sender_id", params.sender_id);
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

export function useCampaignSenders(campaignId: string | null, enabled = false) {
  return useQuery({
    queryKey: ["campaign-senders", campaignId],
    queryFn: async (): Promise<CampaignSendersResponse> => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/senders`);
      if (!res.ok) throw new Error(`Failed to fetch senders: ${res.status}`);
      return res.json();
    },
    enabled: !!campaignId && enabled,
    staleTime: 1000 * 10,
    refetchInterval: enabled ? 15_000 : false,
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

export function useRecalcCampaignStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${id}/recalc-stats`, {
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
      qc.invalidateQueries({ queryKey: ["campaign-stats"] });
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

export function useRetryCampaignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, lead_ids }: { campaignId: string; lead_ids: string[] }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/retry`, {
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

export function useUpdateCampaignLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, leadId, status }: { campaignId: string; leadId: string; status: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, lead_filter }: { campaignId: string; lead_filter: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_filter }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useMoveLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, lead_ids, target_campaign_id, keep_in_source }: { campaignId: string; lead_ids: string[]; target_campaign_id: string; keep_in_source?: boolean }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids, target_campaign_id, keep_in_source }),
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

export function useRemoveSelectedCampaignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, lead_ids }: { campaignId: string; lead_ids: string[] }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/remove`, {
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

export function useSaveAIPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, prompt }: { campaignId: string; prompt: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/ai-prompt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function useGenerateMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, prompt, scope, provider }: { campaignId: string; prompt: string; scope: string; provider?: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/generate-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope, provider }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function usePreviewMessage() {
  return useMutation({
    mutationFn: async ({ campaignId, prompt, provider }: { campaignId: string; prompt: string; provider?: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/preview-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json() as Promise<{
        lead_name: string;
        lead_username: string | null;
        lead_bio: string | null;
        generated_message: string | null;
      }>;
    },
  });
}

export function useRegenerateLeadMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, leadId, prompt, provider }: { campaignId: string; leadId: string; prompt?: string; provider?: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/${leadId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-leads"] });
    },
  });
}

export function useEditLeadMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, leadId, custom_message }: { campaignId: string; leadId: string; custom_message: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/leads/${leadId}/message`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_message }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-leads"] });
    },
  });
}

export function useClearMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/campaigns/${campaignId}/clear-messages`, {
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
      qc.invalidateQueries({ queryKey: ["campaign"] });
      qc.invalidateQueries({ queryKey: ["campaign-leads"] });
    },
  });
}
