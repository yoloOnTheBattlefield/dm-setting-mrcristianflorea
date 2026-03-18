import { useMutation } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface InviteClientPayload {
  email: string;
  first_name: string;
  last_name: string;
  type: "client";
  ghl?: string;
}

interface InviteTeamMemberPayload {
  email: string;
  first_name: string;
  last_name: string;
  type: "team_member";
  account_id: string;
  role?: number;
  has_outbound?: boolean;
  has_research?: boolean;
}

interface InvitationResponse {
  _id: string;
  email: string;
  type: string;
  status: string;
  createdAt: string;
}

export function useInviteClient() {
  return useMutation({
    mutationFn: async (
      payload: InviteClientPayload
    ): Promise<InvitationResponse> => {
      const response = await fetchWithAuth(`${API_URL}/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      return response.json();
    },
  });
}

export function useInviteTeamMember() {
  return useMutation({
    mutationFn: async (
      payload: InviteTeamMemberPayload
    ): Promise<InvitationResponse> => {
      const response = await fetchWithAuth(`${API_URL}/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      return response.json();
    },
  });
}
