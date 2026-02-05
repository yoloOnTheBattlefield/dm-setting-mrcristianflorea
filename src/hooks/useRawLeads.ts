import { useQuery } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/leads"
  : "https://quddify-server.vercel.app/leads";

interface FetchLeadsParams {
  ghlId?: string;
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
}

async function fetchRawLeads({ ghlId, statuses, startDate, endDate, search }: FetchLeadsParams = {}): Promise<ApiLead[]> {
  const params = new URLSearchParams();

  if (ghlId) {
    params.append("ghl", ghlId);
  }

  if (statuses && statuses.length > 0) {
    statuses.forEach(status => params.append("status", status));
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

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }

  const data: ApiLead[] = await response.json();
  return data;
}

export function useRawLeads(params?: FetchLeadsParams) {
  return useQuery({
    queryKey: ["rawLeads", params?.ghlId, params?.statuses, params?.startDate, params?.endDate, params?.search],
    queryFn: () => fetchRawLeads(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
