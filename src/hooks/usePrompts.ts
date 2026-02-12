import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/prompts"
  : "https://quddify-server.vercel.app/prompts";

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
  account_id: string;
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

async function fetchPrompts(accountId: string): Promise<Prompt[]> {
  const response = await fetch(`${API_URL}?account_id=${accountId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch prompts: ${response.status}`);
  }

  const data = await response.json();
  // Handle both flat array and { prompts: [...] } response shapes
  return Array.isArray(data) ? data : data.prompts || [];
}

async function createPrompt(body: CreatePromptBody): Promise<Prompt> {
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${id}`, {
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
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete prompt: ${response.status}`);
  }
}

export function usePrompts(accountId: string | undefined) {
  return useQuery({
    queryKey: ["prompts", accountId],
    queryFn: () => fetchPrompts(accountId!),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", variables.account_id] });
    },
  });
}

export function useUpdatePrompt(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", accountId] });
    },
  });
}

export function useDeletePrompt(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", accountId] });
    },
  });
}
