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
