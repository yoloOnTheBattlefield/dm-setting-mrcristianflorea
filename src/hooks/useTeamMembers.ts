import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamMember } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";

const TEAM_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts/team"
  : "https://quddify-server.vercel.app/accounts/team";

const ACCOUNTS_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts"
  : "https://quddify-server.vercel.app/accounts";

interface AddTeamMemberBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: number;
  has_outbound?: boolean;
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

async function updateTeamMember({ id, body }: { id: string; body: { has_outbound?: boolean } }): Promise<void> {
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

export function useTeamMembers(accountId?: string) {
  return useQuery({
    queryKey: ["teamMembers", accountId],
    queryFn: () => fetchTeamMembers(accountId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
