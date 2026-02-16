import { useQuery } from "@tanstack/react-query";
import { ApiLead, Contact, transformApiLead } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/leads"
  : "https://quddify-server.vercel.app/leads";

interface FetchLeadsParams {
  startDate?: string;
  endDate?: string;
}

async function fetchLeads({ startDate, endDate }: FetchLeadsParams = {}): Promise<Contact[]> {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }

  const data: ApiLead[] = await response.json();
  return data.map(transformApiLead);
}

export function useLeads(params?: FetchLeadsParams) {
  return useQuery({
    queryKey: ["leads", params?.startDate, params?.endDate],
    queryFn: () => fetchLeads(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
