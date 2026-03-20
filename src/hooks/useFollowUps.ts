import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

const BASE = `${API_URL}/api/follow-ups`;

export type FollowUpStatus =
  | "need_reply"
  | "waiting_for_them"
  | "follow_up_later"
  | "hot_lead"
  | "booked"
  | "not_interested";

export interface FollowUpLead {
  username: string;
  fullName: string;
  followersCount: number;
  profileLink: string;
  isVerified: boolean;
  replied_at: string | null;
  dmDate: string | null;
  message: string | null;
  source_seeds: string[];
}

export interface FollowUp {
  _id: string;
  outbound_lead_id: string;
  account_id: string;
  outbound_account_id: string | null;
  status: FollowUpStatus;
  follow_up_date: string | null;
  note: string;
  last_activity: string | null;
  createdAt: string;
  updatedAt: string;
  lead: FollowUpLead;
  outbound_account?: { username: string };
}

export interface FollowUpStats {
  total: number;
  need_reply: number;
  waiting_for_them: number;
  follow_up_later: number;
  hot_lead: number;
  booked: number;
  not_interested: number;
}

interface FollowUpsResponse {
  followUps: FollowUp[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useFollowUps(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sort?: string;
  outbound_account_id?: string;
}) {
  return useQuery({
    queryKey: [
      "follow-ups",
      params.page,
      params.limit,
      params.status,
      params.search,
      params.sort,
      params.outbound_account_id,
    ],
    queryFn: async (): Promise<FollowUpsResponse> => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });
      if (params.status && params.status !== "all") sp.append("status", params.status);
      if (params.search?.trim()) sp.append("search", params.search.trim());
      if (params.sort) sp.append("sort", params.sort);
      if (params.outbound_account_id && params.outbound_account_id !== "all")
        sp.append("outbound_account_id", params.outbound_account_id);
      const res = await fetchWithAuth(`${BASE}?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
    staleTime: 1000 * 15,
  });
}

export function useFollowUpStats() {
  return useQuery({
    queryKey: ["follow-up-stats"],
    queryFn: async (): Promise<FollowUpStats> => {
      const res = await fetchWithAuth(`${BASE}/stats`);
      if (!res.ok) throw new Error("Failed to fetch follow-up stats");
      return res.json();
    },
    staleTime: 1000 * 15,
  });
}

export function useSyncFollowUps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ synced: number }> => {
      const res = await fetchWithAuth(`${BASE}/sync`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync follow-ups");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["follow-up-stats"] });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<FollowUp, "status" | "follow_up_date" | "note">>;
    }) => {
      const res = await fetchWithAuth(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update follow-up");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["follow-up-stats"] });
    },
  });
}
