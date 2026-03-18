import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type {
  AdvisorySession,
  PaginatedResponse,
} from "@/lib/advisory-types";

const BASE_URL = `${API_URL}/api/advisory/sessions`;

interface SessionListParams {
  page?: number;
  limit?: number;
  client_id?: string;
}

async function fetchSessions(
  params: SessionListParams
): Promise<PaginatedResponse<AdvisorySession>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.client_id) sp.set("client_id", params.client_id);
  const response = await fetchWithAuth(`${BASE_URL}?${sp.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.status}`);
  return response.json();
}

async function fetchSession(id: string): Promise<AdvisorySession> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch session: ${response.status}`);
  return response.json();
}

async function createSession(
  body: Partial<AdvisorySession>
): Promise<AdvisorySession> {
  const response = await fetchWithAuth(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to create session: ${response.status}`);
  }
  return response.json();
}

async function updateSession({
  id,
  body,
}: {
  id: string;
  body: Partial<AdvisorySession>;
}): Promise<AdvisorySession> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update session: ${response.status}`);
  }
  return response.json();
}

async function deleteSession(id: string): Promise<void> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete session: ${response.status}`);
  }
}

export function useAdvisorySessions(params: SessionListParams) {
  return useQuery({
    queryKey: ["advisory-sessions", params],
    queryFn: () => fetchSessions(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdvisorySession(id: string) {
  return useQuery({
    queryKey: ["advisory-session", id],
    queryFn: () => fetchSession(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["advisory-sessions"] });
      if (variables.client_id) {
        queryClient.invalidateQueries({
          queryKey: ["advisory-client", variables.client_id],
        });
      }
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSession,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["advisory-sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["advisory-session", variables.id],
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisory-sessions"] });
    },
  });
}
