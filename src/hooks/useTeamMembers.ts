import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamMember } from "@/lib/types";
import { API_URL, fetchWithAuth } from "@/lib/api";

const TEAM_URL = `${API_URL}/accounts/team`;

const ACCOUNTS_URL = `${API_URL}/accounts`;
const CHECK_EMAIL_URL = `${TEAM_URL}/check-email`;

interface AddTeamMemberBody {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role: number;
  has_outbound?: boolean;
  account_id?: string;
}

async function fetchTeamMembers(accountId?: string): Promise<TeamMember[]> {
  const url = accountId ? `${TEAM_URL}?account_id=${accountId}` : TEAM_URL;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch team members: ${response.status}`);
  }

  return response.json();
}

async function addTeamMember(body: AddTeamMemberBody): Promise<TeamMember> {
  const response = await fetchWithAuth(TEAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to add team member: ${response.status}`);
  }

  return response.json();
}

async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetchWithAuth(`${TEAM_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete team member: ${response.status}`);
  }
}

async function updateTeamMember({ id, body }: { id: string; body: { has_outbound?: boolean; account_id?: string } }): Promise<void> {
  const response = await fetchWithAuth(`${ACCOUNTS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update team member: ${response.status}`);
  }
}

export async function checkTeamEmail(email: string): Promise<{ exists: boolean; first_name?: string; last_name?: string }> {
  const response = await fetchWithAuth(`${CHECK_EMAIL_URL}?email=${encodeURIComponent(email)}`);
  if (!response.ok) return { exists: false };
  return response.json();
}

export function useTeamMembers(accountId?: string) {
  return useQuery({
    queryKey: ["teamMembers", accountId],
    queryFn: () => fetchTeamMembers(accountId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
  });
}

async function resetPassword({ userId, new_password }: { userId: string; new_password: string }): Promise<void> {
  const response = await fetchWithAuth(`${ACCOUNTS_URL}/${userId}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to reset password: ${response.status}`);
  }
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}
