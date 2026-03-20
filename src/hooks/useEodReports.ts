import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

const BASE = `${API_URL}/api/eod-reports`;

export interface EodReportStats {
  dms_sent: number;
  replies_received: number;
  bookings_made: number;
  follow_ups_completed: number;
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
}

export interface EodReport {
  _id: string;
  account_id: string;
  user_id: string;
  user_name: string;
  date: string;
  stats: EodReportStats;
  checklist: ChecklistItem[];
  notes: string;
  mood: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useTodayReport() {
  return useQuery({
    queryKey: ["eod-report-today"],
    queryFn: async (): Promise<EodReport> => {
      const res = await fetchWithAuth(`${BASE}/today`);
      if (!res.ok) throw new Error("Failed to fetch today's report");
      return res.json();
    },
    refetchOnWindowFocus: true,
  });
}

export function useTeamReports(date?: string) {
  return useQuery({
    queryKey: ["eod-reports-team", date],
    queryFn: async (): Promise<EodReport[]> => {
      const sp = new URLSearchParams();
      if (date) sp.append("date", date);
      const res = await fetchWithAuth(`${BASE}/team?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch team reports");
      return res.json();
    },
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      checklist?: ChecklistItem[];
      notes?: string;
      mood?: number | null;
    }) => {
      const res = await fetchWithAuth(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eod-report-today"] });
      qc.invalidateQueries({ queryKey: ["eod-reports-team"] });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<EodReport, "checklist" | "notes" | "mood">> }) => {
      const res = await fetchWithAuth(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update report");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eod-report-today"] });
      qc.invalidateQueries({ queryKey: ["eod-reports-team"] });
    },
  });
}
