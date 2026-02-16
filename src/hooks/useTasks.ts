import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

const TASKS_URL = import.meta.env.DEV
  ? "http://localhost:3000/api/tasks"
  : "https://quddify-server.vercel.app/api/tasks";

const STATS_URL = import.meta.env.DEV
  ? "http://localhost:3000/api/stats"
  : "https://quddify-server.vercel.app/api/stats";

export interface Task {
  _id: string;
  account_id: string;
  type: "send_dm" | "follow" | "unfollow";
  target: string;
  outbound_lead_id?: string | null;
  message?: string | null;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: {
    success?: boolean;
    username?: string;
    threadId?: string | null;
    timestamp?: string;
  };
  error?: {
    error?: string;
    errorType?: string;
    stackTrace?: string | null;
    timestamp?: string;
  };
  metadata?: Record<string, unknown>;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchTasks(
  params: { status?: string; type?: string; search?: string; page: number; limit: number }
): Promise<TasksResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.append("status", params.status);
  if (params.type) sp.append("type", params.type);
  if (params.search) sp.append("search", params.search);
  sp.append("page", String(params.page));
  sp.append("limit", String(params.limit));

  const res = await fetchWithAuth(`${TASKS_URL}?${sp.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
  return res.json();
}

async function fetchStats(): Promise<TaskStats> {
  const res = await fetchWithAuth(STATS_URL);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export function useTasks(
  params: { status?: string; type?: string; search?: string; page: number; limit: number }
) {
  return useQuery({
    queryKey: ["tasks", params.status, params.type, params.search, params.page, params.limit],
    queryFn: () => fetchTasks(params),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 10_000,
    staleTime: 1000 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: { target: string; message?: string; outbound_lead_id?: string; type?: string }[]) => {
      const res = await fetchWithAuth(TASKS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create tasks: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    },
  });
}
