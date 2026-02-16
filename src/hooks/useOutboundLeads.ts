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
        qualified: "true",
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

interface ImportXlsxResponse {
  total: number;
  imported: number;
  skipped: number;
  errors?: { username: string; error: string }[];
}

export function useImportOutboundLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ImportXlsxResponse> => {
      const formData = new FormData();
      formData.append("file", file);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
      queryClient.invalidateQueries({ queryKey: ["outbound-leads-stats"] });
    },
  });
}

export async function fetchAllMatchingLeadIds(
  promptFilter?: string
): Promise<string[]> {
  const sp = new URLSearchParams({
    qualified: "true",
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
