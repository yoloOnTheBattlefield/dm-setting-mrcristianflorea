import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts"
  : "https://quddify-server.vercel.app/accounts";

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
  const response = await fetch(API_URL);

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
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
