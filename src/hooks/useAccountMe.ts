import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface AccountMe {
  _id?: string;
  openai_token?: string | null;
  claude_token?: string | null;
  gemini_token?: string | null;
  calendly_token?: string | null;
  stripe_webhook_secret?: string | null;
  telegram_connected?: boolean;
  ig_oauth?: { ig_username?: string } | null;
}

async function fetchAccountMe(): Promise<AccountMe | null> {
  const res = await fetchWithAuth(`${API_URL}/accounts/me`);
  if (!res.ok) throw new Error(`Failed to fetch account: ${res.status}`);
  return res.json();
}

export function useAccountMe() {
  return useQuery({
    queryKey: ["account-me"],
    queryFn: fetchAccountMe,
    staleTime: 1000 * 60,
  });
}

export function useUpdateAccountTokens() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accountId,
      body,
    }: {
      accountId: string;
      body: Partial<Pick<AccountMe, "openai_token" | "claude_token" | "gemini_token">>;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update account: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account-me"] }),
  });
}
