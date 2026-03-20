import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface AIPrompt {
  _id: string;
  name: string;
  promptText: string;
  createdAt: string;
}

export function useAIPrompts() {
  return useQuery({
    queryKey: ["ai-prompts"],
    queryFn: async (): Promise<AIPrompt[]> => {
      const res = await fetchWithAuth(`${API_URL}/api/ai-prompts`);
      if (!res.ok) throw new Error("Failed to fetch AI prompts");
      const data = await res.json();
      return data.prompts;
    },
  });
}

export function useCreateAIPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, promptText }: { name: string; promptText: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/ai-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, promptText }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-prompts"] }),
  });
}

export function useUpdateAIPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, promptText }: { id: string; name: string; promptText: string }) => {
      const res = await fetchWithAuth(`${API_URL}/api/ai-prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, promptText }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-prompts"] }),
  });
}

export function useDeleteAIPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${API_URL}/api/ai-prompts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-prompts"] }),
  });
}
