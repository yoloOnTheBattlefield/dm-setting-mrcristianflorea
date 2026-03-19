import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, useState } from "react";
import { API_URL, fetchWithAuth, apiPost, apiDelete, apiPatch } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { throttle } from "@/lib/throttle";
import type {
  DeepScrapeJob,
  DeepScrapeJobsResponse,
  DeepScrapeJobStatus,
  DeepScrapeJobStats,
  DeepScrapeLogEntry,
  DeepScrapeLeadEntry,
  DeepScrapeTargetStat,
} from "@/lib/types";

// --- Queries ---

export function useDeepScrapeJobs(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["deep-scrape-jobs", params.status, params.page, params.limit],
    queryFn: async (): Promise<DeepScrapeJobsResponse> => {
      const sp = new URLSearchParams();
      if (params.status) sp.append("status", params.status);
      if (params.page) sp.append("page", String(params.page));
      if (params.limit) sp.append("limit", String(params.limit));
      const res = await fetchWithAuth(
        `${API_URL}/api/deep-scrape?${sp.toString()}`,
      );
      if (!res.ok)
        throw new Error(`Failed to fetch deep scrape jobs: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useDeepScrapeJob(jobId: string | null) {
  return useQuery({
    queryKey: ["deep-scrape-job", jobId],
    queryFn: async (): Promise<DeepScrapeJob> => {
      const res = await fetchWithAuth(`${API_URL}/api/deep-scrape/${jobId}`);
      if (!res.ok)
        throw new Error(`Failed to fetch deep scrape job: ${res.status}`);
      return res.json();
    },
    enabled: !!jobId,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useDeepScrapeTargetStats() {
  return useQuery({
    queryKey: ["deep-scrape-target-stats"],
    queryFn: async (): Promise<{ targets: DeepScrapeTargetStat[] }> => {
      const res = await fetchWithAuth(
        `${API_URL}/api/deep-scrape/target-stats`,
      );
      if (!res.ok)
        throw new Error(`Failed to fetch target stats: ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// --- Mutations ---

export function useStartDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name?: string;
      mode?: "outbound" | "research";
      seed_usernames?: string[];
      direct_urls?: string[];
      scrape_type?: "reels" | "posts";
      scrape_comments?: boolean;
      scrape_likers?: boolean;
      scrape_followers?: boolean;
      scrape_emails?: boolean;
      reel_limit?: number;
      comment_limit?: number;
      min_followers?: number;
      force_reprocess?: boolean;
      prompt_id?: string;
      is_recurring?: boolean;
      repeat_interval_days?: number;
    }) => apiPost(`${API_URL}/api/deep-scrape/start`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] }),
  });
}

export function usePauseDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/deep-scrape/${id}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useCancelDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/deep-scrape/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useResumeDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/deep-scrape/${id}/resume`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useSkipComments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/deep-scrape/${id}/skip-comments`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useResumeComments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`${API_URL}/api/deep-scrape/${id}/resume-comments`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useAddDeepScrapeLeadsToCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, campaign_id }: { jobId: string; campaign_id: string }) =>
      apiPost<{ added: number; duplicates_skipped: number; total_qualified: number }>(
        `${API_URL}/api/deep-scrape/${jobId}/add-to-campaign`,
        { campaign_id },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}

export function useDeleteDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`${API_URL}/api/deep-scrape/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

export function useUpdateDeepScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiPatch(`${API_URL}/api/deep-scrape/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
      qc.invalidateQueries({ queryKey: ["deep-scrape-job"] });
    },
  });
}

// --- Socket.IO real-time updates ---

export function useDeepScrapeSocket(
  onLog?: (entry: DeepScrapeLogEntry) => void,
  onLead?: (entry: DeepScrapeLeadEntry) => void,
) {
  const { socket } = useSocket();
  const qc = useQueryClient();
  const onLogRef = useRef(onLog);
  onLogRef.current = onLog;
  const onLeadRef = useRef(onLead);
  onLeadRef.current = onLead;

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (data: {
      jobId: string;
      status: DeepScrapeJobStatus;
    }) => {
      qc.setQueryData<DeepScrapeJob>(
        ["deep-scrape-job", data.jobId],
        (old) => {
          if (!old) return old;
          return { ...old, status: data.status };
        },
      );
      qc.invalidateQueries({ queryKey: ["deep-scrape-jobs"] });
    };

    const handleProgressRaw = (data: {
      jobId: string;
      stats: DeepScrapeJobStats;
    }) => {
      qc.setQueryData<DeepScrapeJob>(
        ["deep-scrape-job", data.jobId],
        (old) => {
          if (!old) return old;
          return { ...old, stats: data.stats };
        },
      );
      qc.setQueriesData<DeepScrapeJobsResponse>(
        { queryKey: ["deep-scrape-jobs"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            jobs: old.jobs.map((j) =>
              j._id === data.jobId ? { ...j, stats: data.stats } : j,
            ),
          };
        },
      );
    };

    const handleProgress = throttle(handleProgressRaw, 500);

    const handleLog = (data: DeepScrapeLogEntry) => {
      onLogRef.current?.(data);
    };

    const handleLead = (data: DeepScrapeLeadEntry) => {
      onLeadRef.current?.(data);
    };

    socket.on("deep-scrape:status", handleStatus);
    socket.on("deep-scrape:progress", handleProgress);
    socket.on("deep-scrape:log", handleLog);
    socket.on("deep-scrape:lead", handleLead);

    return () => {
      socket.off("deep-scrape:status", handleStatus);
      socket.off("deep-scrape:progress", handleProgress);
      socket.off("deep-scrape:log", handleLog);
      socket.off("deep-scrape:lead", handleLead);
    };
  }, [socket, qc]);
}

// Hook to manage log entries for a specific job
export function useDeepScrapeLogs(jobId: string | null) {
  const [logs, setLogs] = useState<DeepScrapeLogEntry[]>([]);

  const handleLog = useCallback(
    (entry: DeepScrapeLogEntry) => {
      if (entry.jobId === jobId) {
        setLogs((prev) => [...prev, entry]);
      }
    },
    [jobId],
  );

  // Clear logs when job changes
  useEffect(() => {
    setLogs([]);
  }, [jobId]);

  return { logs, onLog: handleLog };
}

// Hook to manage lead entries for a specific job (real-time + API)
export function useDeepScrapeLeads(jobId: string | null) {
  const [leads, setLeads] = useState<DeepScrapeLeadEntry[]>([]);

  // Fetch existing leads from API when job is selected
  useEffect(() => {
    setLeads([]);
    if (!jobId) return;

    let cancelled = false;
    fetchWithAuth(`${API_URL}/api/deep-scrape/${jobId}/leads?limit=200`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.leads) return;
        setLeads(
          data.leads.map((l: { username: string; fullName: string | null; followersCount: number; qualified: boolean | null; unqualified_reason: string | null; bio: string | null }) => ({
            jobId: jobId!,
            username: l.username,
            fullName: l.fullName,
            followersCount: l.followersCount,
            qualified: l.qualified,
            unqualified_reason: l.unqualified_reason,
            bio: l.bio,
          })),
        );
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [jobId]);

  const handleLead = useCallback(
    (entry: DeepScrapeLeadEntry) => {
      if (entry.jobId === jobId) {
        setLeads((prev) => [entry, ...prev]);
      }
    },
    [jobId],
  );

  return { leads, onLead: handleLead };
}
