import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export type MatchMode = "partial" | "whole";

export interface CommentRule {
  _id: string;
  account_id: string;
  ig_user_id: string;
  name: string | null;
  media_ids: string[];
  keywords: string[];
  match_mode: MatchMode;
  dm_text: string;
  link_url: string | null;
  reply_publicly: boolean;
  public_replies: string[];
  active: boolean;
  matched_count: number;
  sent_count: number;
  createdAt: string;
  updatedAt: string;
}

export type CommentEventStatus = "queued" | "sent" | "failed" | "skipped";

export interface CommentEvent {
  _id: string;
  rule_id: string | null;
  comment_id: string;
  media_id: string | null;
  comment_text: string | null;
  matched_keyword: string | null;
  commenter_username: string | null;
  lead_id: string | null;
  status: CommentEventStatus;
  skip_reason: string | null;
  attempts: number;
  error: string | null;
  sent_at: string | null;
  createdAt: string;
}

export interface ConnectedIgAccount {
  ig_user_id: string;
  ig_username: string | null;
  kind: "account" | "outbound";
}

export interface CommentRuleInput {
  ig_user_id: string;
  name?: string | null;
  media_ids?: string[];
  keywords: string[];
  match_mode?: MatchMode;
  dm_text: string;
  link_url?: string | null;
  reply_publicly?: boolean;
  public_replies?: string[];
  active?: boolean;
}

const BASE = `${API_URL}/api/comment-rules`;

export function useCommentRules() {
  return useQuery({
    queryKey: ["comment-rules"],
    queryFn: () => apiGet<{ rules: CommentRule[] }>(BASE),
  });
}

export function useCommentIgAccounts() {
  return useQuery({
    queryKey: ["comment-rules", "ig-accounts"],
    queryFn: () => apiGet<{ accounts: ConnectedIgAccount[] }>(`${BASE}/ig-accounts`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCommentEvents(status?: CommentEventStatus) {
  return useQuery({
    queryKey: ["comment-rules", "events", status ?? "all"],
    queryFn: () =>
      apiGet<{ events: CommentEvent[] }>(
        status ? `${BASE}/events?status=${status}` : `${BASE}/events`,
      ),
    refetchInterval: 30_000,
  });
}

export function useCreateCommentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CommentRuleInput) => apiPost<{ rule: CommentRule }>(BASE, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment-rules"] }),
  });
}

export function useUpdateCommentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CommentRuleInput> & { id: string }) =>
      apiPatch<{ rule: CommentRule }>(`${BASE}/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment-rules"] }),
  });
}

export function useDeleteCommentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`${BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment-rules"] }),
  });
}
