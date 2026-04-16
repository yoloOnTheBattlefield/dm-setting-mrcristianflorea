import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface AIProviderUsage {
  // OpenAI (org costs)
  totalUsageUsd?: number | null;
  period?: string;
  source?: string;
  // OpenAI (credit grants)
  totalGranted?: number | null;
  totalUsed?: number | null;
  totalAvailable?: number | null;
  // Anthropic
  inputTokens?: number | null;
  outputTokens?: number | null;
  // Error
  error?: string;
}

export interface AIUsageData {
  openai?: AIProviderUsage;
  claude?: AIProviderUsage;
  gemini?: AIProviderUsage;
}

export function useAIUsage(enabled: boolean) {
  return useQuery({
    queryKey: ["ai-usage"],
    queryFn: async (): Promise<AIUsageData> => {
      const res = await fetchWithAuth(`${API_URL}/api/ai-usage`);
      if (!res.ok) throw new Error(`Failed to fetch AI usage: ${res.status}`);
      return res.json();
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
