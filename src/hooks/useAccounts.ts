import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface Account {
  _id: string;
  ghl: string;
  name: string;
  email: string;
  calendly?: string | null;
  calendly_token?: string | null;
  ghl_lead_booked_webhook?: string | null;
}

async function fetchAccounts(): Promise<Account[]> {
  const response = await fetchWithAuth(`${API_URL}/accounts`);

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.status}`);
  }

  const data: Account[] = await response.json();
  return data;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 1000 * 60 * 10,
  });
}
