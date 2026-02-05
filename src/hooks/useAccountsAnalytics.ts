import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts/analytics"
  : "https://quddify-server.vercel.app/accounts/analytics";

interface AccountAnalytics {
  account_id: string;
  ghl: string;
  name: string;
  totalLeads: number;
  qualified: number;
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

  const url = `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

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
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
