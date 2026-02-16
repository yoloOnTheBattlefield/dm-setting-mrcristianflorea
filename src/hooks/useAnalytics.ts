import { useQuery } from "@tanstack/react-query";
import {
  FunnelMetrics,
  VelocityMetrics,
  DailyVolume,
  GhostingBucket,
  FupEffectiveness,
  StageAging,
  CumulativeBooking,
  SourceFilter,
} from "@/lib/types";
import { RadarDataPoint } from "@/components/dashboard/LeadsRadarChart";
import { fetchWithAuth } from "@/lib/api";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/analytics"
  : "https://quddify-server.vercel.app/analytics";

interface FetchAnalyticsParams {
  startDate?: string;
  endDate?: string;
  source?: SourceFilter;
  accountId?: string;
}

interface AnalyticsResponse {
  funnel: FunnelMetrics;
  velocity: VelocityMetrics;
  dailyVolume: DailyVolume[];
  ghosting: GhostingBucket[];
  fup: FupEffectiveness;
  aging: StageAging[];
  cumulative: CumulativeBooking[];
  radar?: RadarDataPoint[];
}

async function fetchAnalytics({
  startDate,
  endDate,
  source,
  accountId,
}: FetchAnalyticsParams = {}): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  if (source && source !== "all") {
    params.append("source", source);
  }

  if (accountId) {
    params.append("account_id", accountId);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.status}`);
  }

  const data: AnalyticsResponse = await response.json();
  return data;
}

export function useAnalytics(params?: FetchAnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", params?.startDate, params?.endDate, params?.source, params?.accountId],
    queryFn: () => fetchAnalytics(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
