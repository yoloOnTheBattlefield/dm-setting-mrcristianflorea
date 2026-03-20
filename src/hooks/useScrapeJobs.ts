import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { API_URL, fetchWithAuth, apiPost, apiDelete } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { throttle } from "@/lib/throttle";
import type { ScrapeJob, ScrapeJobsResponse, ScrapeJobStatus } from "@/lib/types";

// --- Queries ---

export function useScrapeJobs(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["scrape-jobs", params.status, params.page, params.limit],
    queryFn: async (): Promise<ScrapeJobsResponse> => {
      const sp = new URLSearchParams();
      if (params.status) sp.append("status", params.status);
      if (params.page) sp.append("page", String(params.page));
      if (params.limit) sp.append("limit", String(params.limit));
      const res = await fetchWithAuth(`${API_URL}/api/scrape?${sp.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch scrape jobs: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 10,
  });
}

export function useScrapeJob(jobId: string | null) {
  return useQuery({
    queryKey: ["scrape-job", jobId],
    queryFn: async (): Promise<ScrapeJob> => {
      const res = await fetchWithAuth(`${API_URL}/api/scrape/${jobId}`);
      if (!res.ok) throw new Error(`Failed to fetch scrape job: ${res.status}`);
      return res.json();
    },
    enabled: !!jobId,
    staleTime: 1000 * 5,
  });
}

// --- Mutations ---

export function useStartScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { target_username: string; ig_username: string }) =>
      apiPost(`${API_URL}/api/scrape/start`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scrape-jobs"] }),
  });
}

export function useCancelScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/scrape/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["scrape-job"] });
    },
  });
}

export function usePauseScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/scrape/${id}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["scrape-job"] });
    },
  });
}

export function useDeleteScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`${API_URL}/api/scrape/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["scrape-job"] });
    },
  });
}

export function useResumeScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/scrape/${id}/resume`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["scrape-job"] });
    },
  });
}

// --- Socket.IO real-time updates ---

export function useScrapeSocket() {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (data: { jobId: string; status: ScrapeJobStatus }) => {
      // Update the specific job in cache
      qc.setQueryData<ScrapeJob>(["scrape-job", data.jobId], (old) => {
        if (!old) return old;
        return { ...old, status: data.status };
      });
      // Invalidate the list so it refetches
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
    };

    const handleProgressRaw = (data: {
      jobId: string;
      total_followers: number;
      followers_collected: number;
      bios_fetched: number;
      results: {
        leads_created: number;
        leads_updated: number;
        leads_filtered: number;
        leads_unqualified: number;
        leads_skipped: number;
      };
    }) => {
      // Update the specific job in cache with progress
      qc.setQueryData<ScrapeJob>(["scrape-job", data.jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          total_followers: data.total_followers,
          followers_collected: data.followers_collected,
          bios_fetched: data.bios_fetched,
          results: data.results,
        };
      });
      // Also update the job in the list cache
      qc.setQueriesData<ScrapeJobsResponse>(
        { queryKey: ["scrape-jobs"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            jobs: old.jobs.map((j) =>
              j._id === data.jobId
                ? {
                    ...j,
                    total_followers: data.total_followers,
                    followers_collected: data.followers_collected,
                    bios_fetched: data.bios_fetched,
                    results: data.results,
                  }
                : j
            ),
          };
        }
      );
    };

    const handleProgress = throttle(handleProgressRaw, 500);

    socket.on("scrape:status", handleStatus);
    socket.on("scrape:progress", handleProgress);

    return () => {
      socket.off("scrape:status", handleStatus);
      socket.off("scrape:progress", handleProgress);
    };
  }, [socket, qc]);
}
