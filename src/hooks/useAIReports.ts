import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

// --- Interfaces ---

export interface AIReportActionItem {
  priority: "high" | "medium" | "low";
  action: string;
  expected_impact: string;
}

export interface AIReportContent {
  executive_summary: string;
  overall_health: "green" | "yellow" | "red";
  sender_analysis: {
    summary: string;
    rankings: { sender: string; rating: "strong" | "average" | "weak"; reason: string }[];
    recommendations: string[];
  };
  message_strategy: {
    summary: string;
    top_performers: { preview: string; why_it_works: string }[];
    worst_performers: { preview: string; why_it_fails: string }[];
    recommendations: string[];
  };
  industry_analysis: {
    summary: string;
    best_niches: { niche: string; reply_rate: number; reason: string }[];
    worst_niches: { niche: string; reply_rate: number; reason: string }[];
    recommendations: string[];
  };
  campaign_analysis: {
    summary: string;
    highlights: string[];
    recommendations: string[];
  };
  timing_analysis: {
    best_times: string;
    worst_times: string;
    recommendations: string[];
  };
  conversation_analysis?: {
    summary: string;
    common_objections: { objection: string; frequency: string; best_response: string }[];
    positive_patterns: { pattern: string; example: string; why_it_works: string }[];
    negative_patterns: { pattern: string; example: string; why_it_fails: string }[];
    recommendations: string[];
  };
  message_recommendations?: {
    summary: string;
    do_more: string[];
    avoid: string[];
    example_openers: string[];
  };
  operational_recommendations?: {
    summary: string;
    items: { category: string; action: string; expected_impact: string }[];
  };
  action_items: AIReportActionItem[];
}

export interface AIReport {
  _id: string;
  type: "on_demand" | "weekly" | "monthly";
  status: "generating" | "completed" | "failed";
  date_range: { start: string; end: string };
  campaign_id?: string;
  report: AIReportContent | null;
  token_usage?: { input_tokens: number; output_tokens: number };
  error?: string;
  generated_at: string;
}

export interface AIReportListItem {
  _id: string;
  type: string;
  status: string;
  date_range: { start: string; end: string };
  campaign_id?: string;
  report?: { executive_summary: string; overall_health: string };
  error?: string;
  generated_at: string;
}

// --- Hooks ---

export function useGenerateAIReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      start_date?: string;
      end_date?: string;
      campaign_id?: string;
    }): Promise<{ report_id: string; status: string }> => {
      const res = await fetchWithAuth(`${API_URL}/analytics/outbound/ai-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-reports"] });
    },
  });
}

export function useAIReports(limit = 10, campaignId?: string) {
  return useQuery({
    queryKey: ["ai-reports", limit, campaignId],
    queryFn: async (): Promise<AIReportListItem[]> => {
      const sp = new URLSearchParams({ limit: String(limit) });
      if (campaignId) sp.append("campaign_id", campaignId);
      const res = await fetchWithAuth(`${API_URL}/analytics/outbound/ai-reports?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      return data.reports;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAIReport(reportId: string | null) {
  return useQuery({
    queryKey: ["ai-report", reportId],
    queryFn: async (): Promise<AIReport> => {
      const res = await fetchWithAuth(`${API_URL}/analytics/outbound/ai-reports/${reportId}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.status === "generating") return 3000;
      return false;
    },
    staleTime: 1000 * 60 * 5,
  });
}
