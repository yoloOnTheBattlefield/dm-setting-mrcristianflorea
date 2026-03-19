import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { IgConversationResponse } from "@/lib/types";

export function useLeadConversation(igThreadId: string | null | undefined) {
  return useQuery<IgConversationResponse>({
    queryKey: ["lead-conversation", igThreadId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/ig-conversations/by-thread/${igThreadId}`
      );
      if (res.status === 404) return null as unknown as IgConversationResponse;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!igThreadId,
    staleTime: 1000 * 60,
  });
}
