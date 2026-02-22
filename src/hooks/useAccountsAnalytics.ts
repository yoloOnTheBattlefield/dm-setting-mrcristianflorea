import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface AccountAnalytics {
  account_id: string;
  ghl: string;
  name: string;
  deleted?: boolean;
  totalLeads: number;
  link_sent: number;
  booked: number;
  ghosted: number;
  follow_up: number;
  low_ticket: number;
}

interface FetchAccountsAnalyticsParams {
  startDate?: string;
  endDate?: string;
  showDeleted?: boolean;
}

async function fetchAccountsAnalytics({
  startDate,
  endDate,
  showDeleted,
}: FetchAccountsAnalyticsParams = {}): Promise<AccountAnalytics[]> {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  if (showDeleted) {
    params.append("show_deleted", "true");
  }

  const url = `${API_URL}/accounts/analytics${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts analytics: ${response.status}`);
  }

  const data: AccountAnalytics[] = await response.json();
  return data;
}

export function useAccountsAnalytics(params?: FetchAccountsAnalyticsParams) {
  return useQuery({
    queryKey: ["accountsAnalytics", params?.startDate, params?.endDate, params?.showDeleted],
    queryFn: () => fetchAccountsAnalytics(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/accounts/${id}/delete`, { method: "PATCH" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accountsAnalytics"] });
    },
  });
}

export function useRestoreAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/accounts/${id}/restore`, { method: "PATCH" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accountsAnalytics"] });
    },
  });
}
