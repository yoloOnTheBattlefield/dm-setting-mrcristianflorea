import { useQuery } from "@tanstack/react-query";
import { ApiLead, Contact, transformApiLead } from "@/lib/types";

const API_URL = "https://quddify-server.vercel.app/leads";

async function fetchLeads(): Promise<Contact[]> {
  const response = await fetch(API_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }
  
  const data: ApiLead[] = await response.json();
  return data.map(transformApiLead);
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
