import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamMember } from "@/lib/types";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts/team"
  : "https://quddify-server.vercel.app/accounts/team";

interface AddTeamMemberBody {
  account_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: number;
}

async function fetchTeamMembers(accountId: string): Promise<TeamMember[]> {
  const response = await fetch(`${API_URL}?account_id=${accountId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch team members: ${response.status}`);
  }

  return response.json();
}

async function addTeamMember(body: AddTeamMemberBody): Promise<TeamMember> {
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete team member: ${response.status}`);
  }
}

export function useTeamMembers(accountId: string | undefined) {
  return useQuery({
    queryKey: ["teamMembers", accountId],
    queryFn: () => fetchTeamMembers(accountId!),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTeamMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.account_id] });
    },
  });
}

export function useDeleteTeamMember(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", accountId] });
    },
  });
}
