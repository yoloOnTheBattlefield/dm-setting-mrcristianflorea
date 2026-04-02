import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface GhlMessage {
  _id: string;
  role: "user" | "bot";
  direction: "inbound" | "outbound";
  text: string;
}

export interface GhlConversationResponse {
  messages: GhlMessage[];
  total: number;
}

export function useGhlConversation(leadId: string | undefined) {
  return useQuery<GhlConversationResponse>({
    queryKey: ["ghl-conversation", leadId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_URL}/leads/${leadId}/ghl-conversation`);
      if (res.status === 404) return { messages: [], total: 0 };
      if (!res.ok) throw new Error("Failed to fetch GHL conversation");
      return res.json();
    },
    enabled: !!leadId,
    staleTime: 1000 * 60,
  });
}
