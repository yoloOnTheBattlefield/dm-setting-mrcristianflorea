import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

export interface LeadNote {
  _id: string;
  lead_id: string | null;
  outbound_lead_id: string | null;
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
    // Optimistic update — add note to cache immediately
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["lead-notes", vars.lead_id] });
      const previous = qc.getQueryData<LeadNote[]>(["lead-notes", vars.lead_id]);

      const optimistic: LeadNote = {
        _id: `temp-${Date.now()}`,
        lead_id: vars.lead_id,
        outbound_lead_id: null,
        account_id: "",
        author_id: "",
        author_name: "You",
        content: vars.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData<LeadNote[]>(["lead-notes", vars.lead_id], (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, vars, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(["lead-notes", vars.lead_id], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
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
    // Optimistic delete — remove note from cache immediately
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["lead-notes", vars.lead_id] });
      const previous = qc.getQueryData<LeadNote[]>(["lead-notes", vars.lead_id]);

      qc.setQueryData<LeadNote[]>(["lead-notes", vars.lead_id], (old) =>
        (old ?? []).filter((note) => note._id !== vars.id),
      );

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["lead-notes", vars.lead_id], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-notes", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["lead-notes-outbound", vars.lead_id] });
    },
  });
}

export function useOutboundLeadNotes(outboundLeadId: string | undefined) {
  return useQuery<LeadNote[]>({
    queryKey: ["lead-notes-outbound", outboundLeadId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${API_URL}/api/lead-notes?outbound_lead_id=${outboundLeadId}`
      );
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!outboundLeadId,
    staleTime: 1000 * 60,
  });
}

export function useCreateOutboundLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      outbound_lead_id,
      content,
    }: {
      outbound_lead_id: string;
      content: string;
    }) => {
      const res = await fetchWithAuth(`${API_URL}/api/lead-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outbound_lead_id, content }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    // Optimistic update
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["lead-notes-outbound", vars.outbound_lead_id] });
      const previous = qc.getQueryData<LeadNote[]>(["lead-notes-outbound", vars.outbound_lead_id]);

      const optimistic: LeadNote = {
        _id: `temp-${Date.now()}`,
        lead_id: null,
        outbound_lead_id: vars.outbound_lead_id,
        account_id: "",
        author_id: "",
        author_name: "You",
        content: vars.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData<LeadNote[]>(["lead-notes-outbound", vars.outbound_lead_id], (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["lead-notes-outbound", vars.outbound_lead_id], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-notes-outbound", vars.outbound_lead_id] });
    },
  });
}
