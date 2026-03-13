import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface SenderAccount {
  _id: string;
  account_id: string;
  ig_username: string | null;
  display_name: string | null;
  browser_id: string | null;
  outbound_account_id: string | null;
  daily_limit: number;
  status: "online" | "offline" | "restricted";
  last_seen: string | null;
  socket_id: string | null;
  upcomingTask: { target: string; type: string; status: string } | null;
  outbound_account: { _id: string; username: string; status: string } | null;
  link_status: "linked" | "not_linked";
  reply_rate_7d: number | null;
  is_connected_to_ai: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SendersResponse {
  senders: SenderAccount[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useSenderAccounts(
  params?: { page?: number; limit?: number; refetchInterval?: number }
) {
  const page = params?.page;
  const limit = params?.limit ?? 50;

  return useQuery({
    queryKey: ["sender-accounts", page, limit],
    queryFn: async (): Promise<SendersResponse> => {
      const sp = new URLSearchParams();
      if (page) sp.append("page", String(page));
      sp.append("limit", String(limit));
      const res = await fetchWithAuth(`${API_URL}/api/sender-accounts?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch senders: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 10,
    refetchInterval: params?.refetchInterval,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateSenderAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { display_name?: string; daily_limit?: number } }) => {
      const res = await fetchWithAuth(`${API_URL}/api/sender-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
    },
  });
}

export function useCreateSenderAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { ig_username: string; display_name?: string; daily_limit?: number }) => {
      const res = await fetchWithAuth(`${API_URL}/api/sender-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
    },
  });
}

export function useDeleteSenderAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/sender-accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
    },
  });
}
