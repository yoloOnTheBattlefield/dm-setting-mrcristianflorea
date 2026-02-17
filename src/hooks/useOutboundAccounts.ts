import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface OutboundAccount {
  _id: string;
  account_id: string;
  username: string;
  password: string | null;
  email: string | null;
  emailPassword: string | null;
  proxy: string | null;
  status: "new" | "warming" | "ready" | "restricted" | "disabled";
  isConnectedToAISetter: boolean;
  assignedTo: string | null;
  isBlacklisted: boolean;
  notes: string | null;
  twoFA: string | null;
  browser_token: string | null;
  linked_sender_status: "online" | "offline" | "restricted" | null;
  warmup?: {
    enabled: boolean;
    startDate: string | null;
    schedule: { day: number; cap: number }[];
    checklist: {
      key: string;
      label: string;
      completed: boolean;
      completedAt: string | null;
      completedBy: string | null;
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

interface OutboundAccountsResponse {
  accounts: OutboundAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useOutboundAccounts(params: {
  page: number;
  limit: number;
  status?: string;
  isBlacklisted?: string;
  isConnectedToAISetter?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [
      "outbound-accounts",
      params.page,
      params.limit,
      params.status,
      params.isBlacklisted,
      params.isConnectedToAISetter,
      params.search,
    ],
    queryFn: async (): Promise<OutboundAccountsResponse> => {
      const sp = new URLSearchParams();
      sp.append("page", String(params.page));
      sp.append("limit", String(params.limit));
      if (params.status) sp.append("status", params.status);
      if (params.isBlacklisted) sp.append("isBlacklisted", params.isBlacklisted);
      if (params.isConnectedToAISetter) sp.append("isConnectedToAISetter", params.isConnectedToAISetter);
      if (params.search) sp.append("search", params.search);
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch outbound accounts: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOutboundAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      username: string;
      password?: string;
      email?: string;
      emailPassword?: string;
      proxy?: string;
      status?: string;
      isConnectedToAISetter?: boolean;
      assignedTo?: string;
      isBlacklisted?: boolean;
      notes?: string;
      twoFA?: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts`, {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useUpdateOutboundAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<OutboundAccount, "_id" | "account_id" | "createdAt" | "updatedAt">>;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useDeleteOutboundAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useGenerateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ browser_token: string }> => {
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts/${id}/token`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}

export function useRevokeToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/outbound-accounts/${id}/token`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-accounts"] });
    },
  });
}
