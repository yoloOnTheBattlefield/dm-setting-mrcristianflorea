import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

const LEADS_URL = import.meta.env.DEV
  ? "http://localhost:3000/outbound-leads"
  : "https://quddify-server.vercel.app/outbound-leads";

export interface OutboundLead {
  _id: string;
  username: string;
  fullName: string;
  followersCount?: number;
  source: string;
  promptLabel?: string;
}

interface OutboundLeadsResponse {
  leads: OutboundLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useOutboundLeads(params: {
  page: number;
  limit: number;
  promptId?: string;
}) {
  return useQuery({
    queryKey: ["outbound-leads", params.page, params.limit, params.promptId],
    queryFn: async (): Promise<OutboundLeadsResponse> => {
      const sp = new URLSearchParams({
        isMessaged: "false",
        limit: String(params.limit),
        page: String(params.page),
      });
      if (params.promptId && params.promptId !== "all") {
        sp.append("promptId", params.promptId);
      }
      const res = await fetchWithAuth(`${LEADS_URL}?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });
}

export interface ImportJobStartResponse {
  jobId: string;
  total: number;
}

export interface ImportJobStatus {
  status: "importing" | "done" | "error";
  step: string;
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  campaignLeadsCreated: number;
  errors?: { username: string; error: string }[];
}

export function useStartImport() {
  return useMutation({
    mutationFn: async ({
      file,
      promptId,
      campaignId,
      columnMapping,
    }: {
      file: File;
      promptId?: string;
      campaignId?: string;
      columnMapping?: Record<string, string | null>;
    }): Promise<ImportJobStartResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      if (promptId) formData.append("promptId", promptId);
      if (campaignId) formData.append("campaignId", campaignId);
      if (columnMapping) formData.append("columnMapping", JSON.stringify(columnMapping));
      const res = await fetchWithAuth(`${LEADS_URL}/import-xlsx`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      return res.json();
    },
  });
}

export function useImportStatus(jobId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["import-status", jobId],
    queryFn: async (): Promise<ImportJobStatus> => {
      const res = await fetchWithAuth(
        `${LEADS_URL}/import-xlsx/status/${jobId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch import status");
      const data: ImportJobStatus = await res.json();
      // Invalidate lead queries when done
      if (data.status === "done") {
        queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
        queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      }
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "done" || data?.status === "error") return false;
      return 500;
    },
    refetchOnWindowFocus: false,
  });
}

export async function fetchAllMatchingLeadIds(
  promptFilter?: string
): Promise<string[]> {
  const sp = new URLSearchParams({
    isMessaged: "false",
    limit: "10000",
    page: "1",
  });
  if (promptFilter && promptFilter !== "all") {
    sp.append("promptId", promptFilter);
  }
  const res = await fetchWithAuth(`${LEADS_URL}?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch all lead IDs");
  const data: OutboundLeadsResponse = await res.json();
  return data.leads.map((l) => l._id);
}
