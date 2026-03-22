import { useQuery } from "@tanstack/react-query";
import {
  FunnelMetrics,
  VelocityMetrics,
  DailyVolume,
  GhostingBucket,
  FupEffectiveness,
  StageAging,
  CumulativeBooking,
  SalesMetrics,
  SourceFilter,
} from "@/lib/types";
import { RadarDataPoint } from "@/components/dashboard/LeadsRadarChart";
import { API_URL, fetchWithAuth } from "@/lib/api";

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
  sales?: SalesMetrics;
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

  // Exclude leads linked to outbound to avoid double-counting inbound metrics
  params.append("exclude_linked", "true");

  const url = `${API_URL}/analytics?${params.toString()}`;
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
  });
}
