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

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/analytics"
  : "https://quddify-server.vercel.app/analytics";

interface FetchAnalyticsParams {
  ghlId?: string;
  startDate?: string;
  endDate?: string;
  source?: SourceFilter;
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
  ghlId,
  startDate,
  endDate,
  source,
}: FetchAnalyticsParams = {}): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();

  if (ghlId) {
    params.append("ghl", ghlId);
  }

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  if (source && source !== "all") {
    params.append("source", source);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.status}`);
  }

  const data: AnalyticsResponse = await response.json();
  return data;
}

export function useAnalytics(params?: FetchAnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", params?.ghlId, params?.startDate, params?.endDate, params?.source],
    queryFn: () => fetchAnalytics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
