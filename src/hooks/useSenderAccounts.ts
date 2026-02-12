import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/api/sender-accounts"
  : "https://quddify-server.vercel.app/api/sender-accounts";

export interface SenderAccount {
  _id: string;
  account_id: string;
  ig_username: string;
  display_name: string | null;
  daily_limit: number;
  status: "online" | "offline";
  last_seen: string | null;
  socket_id: string | null;
  upcomingTask: { target: string; type: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface SendersResponse {
  senders: SenderAccount[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function useSenderAccounts(
  apiKey: string | undefined,
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
      const res = await fetch(`${API_URL}?${sp.toString()}`, {
        headers: authHeaders(apiKey!),
      });
      if (!res.ok) throw new Error(`Failed to fetch senders: ${res.status}`);
      return res.json();
    },
    enabled: !!apiKey,
    staleTime: 1000 * 10,
    refetchInterval: params?.refetchInterval,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateSenderAccount(apiKey: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { display_name?: string; daily_limit?: number } }) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: authHeaders(apiKey!),
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

export function useCreateSenderAccount(apiKey: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { ig_username: string; display_name?: string; daily_limit?: number }) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: authHeaders(apiKey!),
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

export function useDeleteSenderAccount(apiKey: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders(apiKey!),
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
