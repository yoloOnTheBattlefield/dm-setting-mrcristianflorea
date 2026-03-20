import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface PromptFilters {
  minFollowers: number;
  minPosts: number;
  excludePrivate: boolean;
  verifiedOnly: boolean;
  bioRequired: boolean;
}

export const DEFAULT_FILTERS: PromptFilters = {
  minFollowers: 40000,
  minPosts: 10,
  excludePrivate: true,
  verifiedOnly: false,
  bioRequired: false,
};

export interface Prompt {
  _id: string;
  account_id: string;
  label: string;
  promptText: string;
  isDefault: boolean;
  filters?: PromptFilters;
  createdAt: string;
  updatedAt: string;
}

interface CreatePromptBody {
  label: string;
  promptText: string;
  isDefault?: boolean;
  filters?: Partial<PromptFilters>;
}

interface UpdatePromptBody {
  label?: string;
  promptText?: string;
  isDefault?: boolean;
  filters?: Partial<PromptFilters>;
}

async function fetchPrompts(): Promise<Prompt[]> {
  const response = await fetchWithAuth(`${API_URL}/prompts`);

  if (!response.ok) {
    throw new Error(`Failed to fetch prompts: ${response.status}`);
  }

  const data = await response.json();
  // Handle both flat array and { prompts: [...] } response shapes
  return Array.isArray(data) ? data : data.prompts || [];
}

async function createPrompt(body: CreatePromptBody): Promise<Prompt> {
  const response = await fetchWithAuth(`${API_URL}/prompts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to create prompt: ${response.status}`);
  }

  return response.json();
}

async function updatePrompt({ id, body }: { id: string; body: UpdatePromptBody }): Promise<Prompt> {
  const response = await fetchWithAuth(`${API_URL}/prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update prompt: ${response.status}`);
  }

  return response.json();
}

async function deletePrompt(id: string): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/prompts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete prompt: ${response.status}`);
  }
}

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: () => fetchPrompts(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
