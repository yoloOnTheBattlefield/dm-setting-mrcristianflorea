import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface AccountAnalytics {
  account_id: string;
  ghl: string;
  name: string;
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
}

async function fetchAccountsAnalytics({
  startDate,
  endDate,
}: FetchAccountsAnalyticsParams = {}): Promise<AccountAnalytics[]> {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
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
    queryKey: ["accountsAnalytics", params?.startDate, params?.endDate],
    queryFn: () => fetchAccountsAnalytics(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
