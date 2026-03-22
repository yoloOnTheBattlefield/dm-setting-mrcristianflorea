import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { Payment } from "@/lib/types";

export function useLeadPayments(leadId: string | undefined) {
  return useQuery({
    queryKey: ["payments", leadId],
    queryFn: async (): Promise<Payment[]> => {
      const res = await fetchWithAuth(`${API_URL}/api/stripe/payments/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!leadId,
  });
}
