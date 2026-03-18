import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import type {
  AdvisoryClient,
  PaginatedResponse,
} from "@/lib/advisory-types";

const BASE_URL = `${API_URL}/api/advisory/clients`;

interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  health?: string;
}

async function fetchClients(
  params: ClientListParams
): Promise<PaginatedResponse<AdvisoryClient>> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.health) sp.set("health", params.health);
  const response = await fetchWithAuth(`${BASE_URL}?${sp.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch clients: ${response.status}`);
  return response.json();
}

async function fetchClient(id: string): Promise<AdvisoryClient> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch client: ${response.status}`);
  return response.json();
}

async function createClient(
  body: Partial<AdvisoryClient>
): Promise<AdvisoryClient> {
  const response = await fetchWithAuth(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to create client: ${response.status}`);
  }
  return response.json();
}

async function updateClient({
  id,
  body,
}: {
  id: string;
  body: Partial<AdvisoryClient>;
}): Promise<AdvisoryClient> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update client: ${response.status}`);
  }
  return response.json();
}

async function deleteClient(id: string): Promise<void> {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete client: ${response.status}`);
  }
}

export function useAdvisoryClients(params: ClientListParams) {
  return useQuery({
    queryKey: ["advisory-clients", params],
    queryFn: () => fetchClients(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAdvisoryClient(id: string) {
  return useQuery({
    queryKey: ["advisory-client", id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisory-clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["advisory-clients"] });
      queryClient.invalidateQueries({
        queryKey: ["advisory-client", variables.id],
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisory-clients"] });
    },
  });
}
