import { useQuery } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/leads"
  : "https://quddify-server.vercel.app/leads";

interface FetchLeadsParams {
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  accountId?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LeadsResponse {
  leads: ApiLead[];
  pagination: PaginationInfo;
}

async function fetchRawLeads({
  statuses,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 20,
  accountId,
}: FetchLeadsParams = {}): Promise<LeadsResponse> {
  const params = new URLSearchParams();

  if (statuses && statuses.length > 0) {
    statuses.forEach((status) => params.append("status", status));
  }

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  if (search) {
    params.append("search", search);
  }

  if (accountId) {
    params.append("account_id", accountId);
  }

  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }

  const data: LeadsResponse = await response.json();
  return data;
}

export function useRawLeads(params?: FetchLeadsParams) {
  return useQuery({
    queryKey: [
      "rawLeads",
      params?.statuses,
      params?.startDate,
      params?.endDate,
      params?.search,
      params?.page,
      params?.limit,
      params?.accountId,
    ],
    queryFn: () => fetchRawLeads(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
