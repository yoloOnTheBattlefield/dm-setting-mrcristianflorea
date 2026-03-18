import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { API_URL, fetchWithAuth } from "@/lib/api";

export type LeadSortField = "date_created" | "link_sent_at" | "booked_at";
export type SortOrder = "asc" | "desc";

interface FetchLeadsParams {
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  accountId?: string;
  sortBy?: LeadSortField;
  sortOrder?: SortOrder;
  excludeLinked?: boolean;
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
  sortBy,
  sortOrder,
  excludeLinked,
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

  if (sortBy) {
    params.append("sort_by", sortBy);
  }

  if (sortOrder) {
    params.append("sort_order", sortOrder);
  }

  if (excludeLinked) {
    params.append("exclude_linked", "true");
  }

  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const url = params.toString() ? `${API_URL}/leads?${params.toString()}` : `${API_URL}/leads`;
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
      params?.sortBy,
      params?.sortOrder,
      params?.excludeLinked,
    ],
    queryFn: () => fetchRawLeads(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
