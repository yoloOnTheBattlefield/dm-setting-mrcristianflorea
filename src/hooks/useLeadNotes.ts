import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface LeadNote {
  _id: string;
  lead_id: string;
  account_id: string;
  author_id: string;
  author_name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useLeadNotes(leadId: string | undefined) {
  return useQuery<LeadNote[]>({
    queryKey: ["lead-notes", leadId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/lead-notes?lead_id=${leadId}`
      );
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!leadId,
    staleTime: 1000 * 60,
  });
}

export function useCreateLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lead_id,
      content,
    }: {
      lead_id: string;
      content: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id, content }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-notes", vars.lead_id] });
    },
  });
}

export function useDeleteLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lead_id,
    }: {
      id: string;
      lead_id: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-notes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-notes", vars.lead_id] });
    },
  });
}
