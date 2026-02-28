import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

// --- Interfaces ---

export interface OutboundFunnelData {
  total: number;
  messaged: number;
  replied: number;
  booked: number;
  contracts: number;
  contract_value: number;
}

export interface MessagePerformance {
  campaign_id: string | null;
  campaign_name: string;
  template_index: number | null;
  template: string;
  sent: number;
  replied: number;
  reply_rate: number;
  booked: number;
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
    refetchOnWindowFocus: false,
  });
}

export function useMessageAnalytics(params?: { campaign_id?: string }) {
  return useQuery({
    queryKey: ["analytics-messages", params?.campaign_id],
    queryFn: async (): Promise<{ messages: MessagePerformance[] }> => {
      const sp = new URLSearchParams();
      if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
      const url = sp.toString() ? `${API_URL}/analytics/messages?${sp.toString()}` : `${API_URL}/analytics/messages`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`Failed to fetch message analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSenderAnalytics(params?: { campaign_id?: string }) {
  return useQuery({
    queryKey: ["analytics-senders", params?.campaign_id],
    queryFn: async (): Promise<{ senders: SenderPerformance[] }> => {
      const sp = new URLSearchParams();
      if (params?.campaign_id) sp.append("campaign_id", params.campaign_id);
      const url = sp.toString() ? `${API_URL}/analytics/senders?${sp.toString()}` : `${API_URL}/analytics/senders`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`Failed to fetch sender analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCampaignAnalytics() {
  return useQuery({
    queryKey: ["analytics-campaigns"],
    queryFn: async (): Promise<{ campaigns: CampaignPerformance[] }> => {
      const res = await fetchWithAuth(`${API_URL}/analytics/campaigns`);
      if (!res.ok) throw new Error(`Failed to fetch campaign analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
  });
}
