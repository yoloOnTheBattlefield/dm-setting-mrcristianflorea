import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

// --- Interfaces ---

export interface OutboundFunnelData {
  messaged: number;
  replied: number;
  link_sent: number;
  booked: number;
  contracts: number;
  contract_value: number;
}

export interface MessagePerformance {
  message: string;
  sent: number;
  replied: number;
  link_sent: number;
  booked: number;
  contracts: number;
  contract_value: number;
  reply_rate: number;
  book_rate: number;
}

export interface SenderPerformance {
  sender_id: string;
  ig_username: string;
  display_name: string | null;
  sent: number;
  replied: number;
  reply_rate: number;
  booked: number;
  book_rate: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  name: string;
  status: string;
  total_leads: number;
  sent: number;
  replied: number;
  reply_rate: number;
  booked: number;
  book_rate: number;
  contract_value: number;
}

// --- Hooks ---

export function useOutboundFunnel(params?: {
  start_date?: string;
  end_date?: string;
  campaign_id?: string;
}) {
  return useQuery({
    queryKey: ["analytics-outbound", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<OutboundFunnelData> => {
      const sp = new URLSearchParams();
      if (params?.start_date) sp.append("start_date", params.start_date);
      if (params?.end_date) sp.append("end_date", params.end_date);
      if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
      const url = sp.toString() ? `${API_URL}/analytics/outbound?${sp.toString()}` : `${API_URL}/analytics/outbound`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`Failed to fetch outbound analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMessageAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-messages", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ messages: MessagePerformance[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/messages", params));
      if (!res.ok) throw new Error(`Failed to fetch message analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSenderAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-senders", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ senders: SenderPerformance[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/senders", params));
      if (!res.ok) throw new Error(`Failed to fetch sender analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCampaignAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-campaigns", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ campaigns: CampaignPerformance[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/campaigns", params));
      if (!res.ok) throw new Error(`Failed to fetch campaign analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// --- Extended Analytics Interfaces ---

export interface DailyActivityData {
  date: string;
  sent: number;
  replied: number;
  link_sent: number;
  booked: number;
}

export interface ResponseSpeedData {
  avg_prospect_reply_time_min: number;
  avg_user_response_time_min: number;
  median_user_response_time_min: number;
  distribution: {
    bucket: string;
    count: number;
    percentage: number;
  }[];
  unanswered_count: number;
  oldest_waiting: {
    lead_name: string;
    waiting_since: string;
    waiting_minutes: number;
  } | null;
  avg_waiting_time_min: number;
}

export interface ConversationDepthData {
  avg_messages_per_conversation: number;
  pct_3_plus_messages: number;
  pct_5_plus_messages: number;
  booking_rate_by_depth: {
    depth: string;
    conversations: number;
    booked: number;
    booking_rate: number;
  }[];
}

export interface AIModelPerformance {
  model: string;
  provider: string;
  messages_sent: number;
  replied: number;
  reply_rate: number;
  booked: number;
  booked_rate: number;
  avg_response_time_min: number;
}

export interface EditedComparisonData {
  ai_generated: {
    count: number;
    reply_rate: number;
    link_sent_rate: number;
    booked_rate: number;
    avg_response_time_min: number;
  };
  edited: {
    count: number;
    reply_rate: number;
    link_sent_rate: number;
    booked_rate: number;
    avg_response_time_min: number;
  };
}

export interface TimeOfDayData {
  hour: number;
  sent: number;
  replied: number;
  reply_rate: number;
}

export interface EffortOutcomeData {
  messages_per_reply: number;
  messages_per_link_sent: number;
  messages_per_booking: number;
  replies_per_booking: number;
}

export interface TrendData {
  date: string;
  reply_rate_7d: number;
  booked_rate_7d: number;
}

// --- Extended Analytics Hooks ---

interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  campaign_id?: string;
}

function buildUrl(path: string, params?: AnalyticsParams) {
  const sp = new URLSearchParams();
  if (params?.start_date) sp.append("start_date", params.start_date);
  if (params?.end_date) sp.append("end_date", params.end_date);
  if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
  return sp.toString() ? `${API_URL}${path}?${sp.toString()}` : `${API_URL}${path}`;
}

export function useDailyActivity(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-daily-activity", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ days: DailyActivityData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/daily", params));
      if (!res.ok) throw new Error(`Failed to fetch daily activity: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useResponseSpeed(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-response-speed", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<ResponseSpeedData> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/response-speed", params));
      if (!res.ok) throw new Error(`Failed to fetch response speed: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useConversationDepth(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-conversation-depth", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<ConversationDepthData> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/conversation-depth", params));
      if (!res.ok) throw new Error(`Failed to fetch conversation depth: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAIModelAnalytics(params?: AnalyticsParams & { sender_id?: string }) {
  return useQuery({
    queryKey: ["analytics-ai-models", params?.start_date, params?.end_date, params?.campaign_id, params?.sender_id],
    queryFn: async (): Promise<{ models: AIModelPerformance[] }> => {
      const sp = new URLSearchParams();
      if (params?.start_date) sp.append("start_date", params.start_date);
      if (params?.end_date) sp.append("end_date", params.end_date);
      if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
      if (params?.sender_id) sp.append("sender_id", params.sender_id);
      const url = sp.toString() ? `${API_URL}/analytics/outbound/ai-models?${sp.toString()}` : `${API_URL}/analytics/outbound/ai-models`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`Failed to fetch AI model analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useEditedComparison(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-edited-comparison", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<EditedComparisonData> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/edited-comparison", params));
      if (!res.ok) throw new Error(`Failed to fetch edited comparison: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTimeOfDay(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-time-of-day", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ hours: TimeOfDayData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/time-of-day", params));
      if (!res.ok) throw new Error(`Failed to fetch time of day analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useEffortOutcome(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-effort-outcome", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<EffortOutcomeData> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/effort-outcome", params));
      if (!res.ok) throw new Error(`Failed to fetch effort outcome: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrendOverTime(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-trend", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ trends: TrendData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/trends", params));
      if (!res.ok) throw new Error(`Failed to fetch trends: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// --- Insights Interfaces ---

export interface FollowerTierData {
  tier: string;
  sent: number;
  replied: number;
  booked: number;
  reply_rate: number;
  book_rate: number;
}

export interface PromptLabelData {
  label: string;
  sent: number;
  replied: number;
  booked: number;
  reply_rate: number;
  book_rate: number;
}

export interface QuestionTypeData {
  type: string;
  sent: number;
  replied: number;
  booked: number;
  reply_rate: number;
  book_rate: number;
}

// --- Insights Hooks ---

export function useFollowerTiers(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-follower-tiers", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ tiers: FollowerTierData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/follower-tiers", params));
      if (!res.ok) throw new Error(`Failed to fetch follower tier analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePromptLabels(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-prompt-labels", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ labels: PromptLabelData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/prompt-labels", params));
      if (!res.ok) throw new Error(`Failed to fetch prompt label analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useQuestionTypes(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-question-types", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ types: QuestionTypeData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/question-types", params));
      if (!res.ok) throw new Error(`Failed to fetch question type analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// --- Score Breakdown ---

export interface ScoreTierData {
  tier: string;
  stars: number;
  sent: number;
  replied: number;
  booked: number;
  contracts: number;
  total_revenue: number;
  reply_rate: number;
  book_rate: number;
  close_rate: number;
  avg_revenue: number;
}

export function useScoreBreakdown(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics-score-breakdown", params?.start_date, params?.end_date, params?.campaign_id],
    queryFn: async (): Promise<{ tiers: ScoreTierData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/outbound/score-breakdown", params));
      if (!res.ok) throw new Error(`Failed to fetch score breakdown: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// --- Weekly Heatmap ---

export interface WeeklyHeatmapCell {
  day: number; // 0=Sun, 1=Mon...6=Sat
  hour: number; // 0-23
  count: number;
}

export function useWeeklyHeatmap(params?: AnalyticsParams & { metric?: string }) {
  return useQuery({
    queryKey: ["analytics-weekly-heatmap", params?.start_date, params?.end_date, params?.campaign_id, params?.metric],
    queryFn: async (): Promise<{ cells: WeeklyHeatmapCell[] }> => {
      const sp = new URLSearchParams();
      if (params?.start_date) sp.append("start_date", params.start_date);
      if (params?.end_date) sp.append("end_date", params.end_date);
      if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
      if (params?.metric) sp.append("metric", params.metric);
      const url = sp.toString() ? `${API_URL}/analytics/outbound/weekly-heatmap?${sp.toString()}` : `${API_URL}/analytics/outbound/weekly-heatmap`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`Failed to fetch weekly heatmap: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
