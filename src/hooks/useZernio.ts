import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, apiGet, apiPost, apiDelete } from "@/lib/api";

export interface ZernioStatus {
  connected: boolean;
  /** Whether a key is stored. The key itself is never returned. */
  has_api_key: boolean;
  profile_id: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  webhook_url: string;
  webhook_registered: boolean;
  connected_at: string | null;
}

export interface ZernioProfile {
  id: string;
  name: string;
}

export interface ZernioIgAccount {
  id: string;
  ig_user_id: string;
  username: string;
  name: string | null;
}

export interface ZernioConnectInput {
  api_key?: string;
  profile_id: string;
  zernio_account_id: string;
  ig_user_id: string;
  ig_username?: string | null;
}

const BASE = `${API_URL}/api/zernio`;

export function useZernioStatus() {
  return useQuery({
    queryKey: ["zernio", "status"],
    queryFn: () => apiGet<ZernioStatus>(`${BASE}/status`),
  });
}

/**
 * Profiles and accounts are POSTs, not GETs, because the API key travels in the
 * body during setup — before anything has been stored server-side.
 */
export function useZernioProfiles() {
  return useMutation({
    mutationFn: (body: { api_key?: string }) =>
      apiPost<{ profiles: ZernioProfile[] }>(`${BASE}/profiles`, body),
  });
}

export function useZernioIgAccounts() {
  return useMutation({
    mutationFn: (body: { api_key?: string; profile_id: string }) =>
      apiPost<{ accounts: ZernioIgAccount[] }>(`${BASE}/accounts`, body),
  });
}

export function useConnectZernio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ZernioConnectInput) =>
      apiPost<{ success: boolean; webhook_registered: boolean }>(`${BASE}/connect`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zernio"] }),
  });
}

export function useDisconnectZernio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<{ success: boolean }>(BASE),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zernio"] }),
  });
}
