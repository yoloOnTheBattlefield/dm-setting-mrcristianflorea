import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

// --- Interfaces ---

export interface InboundOverview {
  total: number;
  booked: number;
  closed: number;
  book_rate: number;
  close_rate: number;
  revenue: number;
  cross_channel: number;
  cross_channel_rate: number;
  sources: SourceBreakdown[];
}

export interface SourceBreakdown {
  source: string;
  total: number;
  booked: number;
  closed: number;
  revenue: number;
}

export interface PostPerformance {
  post_url: string;
  total: number;
  booked: number;
  closed: number;
  book_rate: number;
  close_rate: number;
  revenue: number;
}

export interface InboundDailyData {
  date: string;
  created: number;
  booked: number;
  closed: number;
}

// --- Helpers ---

interface InboundParams {
  start_date?: string;
  end_date?: string;
}

function buildUrl(path: string, params?: InboundParams) {
  const sp = new URLSearchParams();
  if (params?.start_date) sp.append("start_date", params.start_date);
  if (params?.end_date) sp.append("end_date", params.end_date);
  return sp.toString() ? `${API_URL}${path}?${sp.toString()}` : `${API_URL}${path}`;
}

// --- Hooks ---

export function useInboundOverview(params?: InboundParams) {
  return useQuery({
    queryKey: ["analytics-inbound", params?.start_date, params?.end_date],
    queryFn: async (): Promise<InboundOverview> => {
      const res = await fetchWithAuth(buildUrl("/analytics/inbound", params));
      if (!res.ok) throw new Error(`Failed to fetch inbound analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useInboundPosts(params?: InboundParams) {
  return useQuery({
    queryKey: ["analytics-inbound-posts", params?.start_date, params?.end_date],
    queryFn: async (): Promise<{ posts: PostPerformance[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/inbound/posts", params));
      if (!res.ok) throw new Error(`Failed to fetch inbound post analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useInboundDaily(params?: InboundParams) {
  return useQuery({
    queryKey: ["analytics-inbound-daily", params?.start_date, params?.end_date],
    queryFn: async (): Promise<{ days: InboundDailyData[] }> => {
      const res = await fetchWithAuth(buildUrl("/analytics/inbound/daily", params));
      if (!res.ok) throw new Error(`Failed to fetch inbound daily analytics: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
