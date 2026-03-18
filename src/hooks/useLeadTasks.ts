import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface LeadTask {
  _id: string;
  lead_id: string;
  account_id: string;
  author_id: string;
  author_name: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useLeadTasks(leadId: string | undefined) {
  return useQuery<LeadTask[]>({
    queryKey: ["lead-tasks", leadId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/lead-tasks?lead_id=${leadId}`
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!leadId,
    staleTime: 1000 * 60,
  });
}

export function useCreateLeadTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lead_id,
      title,
      due_date,
    }: {
      lead_id: string;
      title: string;
      due_date?: string | null;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id, title, due_date }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-tasks", vars.lead_id] });
    },
  });
}

export function useUpdateLeadTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lead_id,
      ...body
    }: {
      id: string;
      lead_id: string;
      title?: string;
      due_date?: string | null;
      completed_at?: string | null;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-tasks", vars.lead_id] });
    },
  });
}

export function useDeleteLeadTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lead_id,
    }: {
      id: string;
      lead_id: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-tasks", vars.lead_id] });
    },
  });
}
