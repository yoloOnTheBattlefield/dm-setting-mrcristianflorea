import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/jobs"
  : "https://quddify-server.vercel.app/jobs";

export interface JobFileEntry {
  filename: string;
  status: "queued" | "processing" | "completed" | "failed";
  totalRows: number;
  filteredRows: number;
  processedRows: number;
  qualifiedCount: number;
  failedRows: number;
  sourceAccount: string | null;
  scrapeDate: string | null;
  error: string | null;
}

export interface QualificationJob {
  _id: string;
  account_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  promptId: string | null;
  promptLabel: string | null;
  files: JobFileEntry[];
  totalLeads: number;
  processedLeads: number;
  qualifiedLeads: number;
  failedLeads: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  cancelRequested: boolean;
}

interface JobsResponse {
  jobs: QualificationJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchJobs(accountId: string): Promise<JobsResponse> {
  const response = await fetch(`${API_URL}?account_id=${accountId}`);
  if (!response.ok) throw new Error(`Failed to fetch jobs: ${response.status}`);
  return response.json();
}

async function fetchJob(jobId: string): Promise<QualificationJob> {
  const response = await fetch(`${API_URL}/${jobId}`);
  if (!response.ok) throw new Error(`Failed to fetch job: ${response.status}`);
  return response.json();
}

async function cancelJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/${jobId}/cancel`, {
    method: "POST",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || `Failed to cancel job: ${response.status}`,
    );
  }
}

export function useJobs(accountId: string | undefined) {
  const query = useQuery({
    queryKey: ["jobs", accountId],
    queryFn: () => fetchJobs(accountId!),
    enabled: !!accountId,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs;
      const hasActive = jobs?.some((j) => j.status === "running" || j.status === "queued");
      return hasActive ? 5000 : false;
    },
  });
  return query;
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
