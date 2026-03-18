import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type {
  AdvisoryMetric,
  AdvisorySummary,
} from "@/lib/advisory-types";

const BASE_URL = `${API_URL}/api/advisory/metrics`;

async function fetchMetrics(client_id?: string): Promise<AdvisoryMetric[]> {
  const sp = new URLSearchParams();
  if (client_id) sp.set("client_id", client_id);
  const response = await fetchWithAuth(`${BASE_URL}?${sp.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch metrics: ${response.status}`);
  return response.json();
}

async function fetchSummary(): Promise<AdvisorySummary> {
  const response = await fetchWithAuth(`${BASE_URL}/summary`);
  if (!response.ok) throw new Error(`Failed to fetch summary: ${response.status}`);
  return response.json();
}

async function upsertMetric(
  body: Partial<AdvisoryMetric>
): Promise<AdvisoryMetric> {
  const response = await fetchWithAuth(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to upsert metric: ${response.status}`);
  }
  return response.json();
}

async function updateMetric({
  id,
  body,
}: {
  id: string;
  body: Partial<AdvisoryMetric>;
}): Promise<AdvisoryMetric> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update metric: ${response.status}`);
  }
  return response.json();
}

export function useAdvisoryMetrics(client_id?: string) {
  return useQuery({
    queryKey: ["advisory-metrics", client_id],
    queryFn: () => fetchMetrics(client_id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdvisorySummary() {
  return useQuery({
    queryKey: ["advisory-summary"],
    queryFn: fetchSummary,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useUpsertMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisory-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["advisory-summary"] });
    },
  });
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisory-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["advisory-summary"] });
    },
  });
}
