import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useLeadConversation } from "./useLeadConversation";

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "@/lib/api";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

const mockConversationResponse = {
  conversation: {
    _id: "conv1",
    instagram_thread_id: "thread123",
    account_id: "acc1",
    participant_ids: ["uid1", "uid2"],
    participant_usernames: { uid1: "user1", uid2: "user2" },
    created_at: "2024-01-01T00:00:00Z",
  },
  messages: [
    {
      _id: "msg1",
      conversation_id: "conv1",
      account_id: "acc1",
      direction: "outbound" as const,
      sender_id: "uid2",
      recipient_id: "uid1",
      message_text: "Hey there!",
      message_id: "igmsg1",
      timestamp: "2024-01-01T10:00:00Z",
      created_at: "2024-01-01T10:00:00Z",
    },
    {
      _id: "msg2",
      conversation_id: "conv1",
      account_id: "acc1",
      direction: "inbound" as const,
      sender_id: "uid1",
      recipient_id: "uid2",
      message_text: "Hi!",
      message_id: "igmsg2",
      timestamp: "2024-01-01T10:01:00Z",
      created_at: "2024-01-01T10:01:00Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 100,
};

describe("useLeadConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when leadId is undefined", () => {
    const { result } = renderHook(() => useLeadConversation(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches and returns conversation data", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockConversationResponse,
    } as Response);

    const { result } = renderHook(() => useLeadConversation("lead123"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/api/ig-conversations/by-lead/lead123"
    );
    expect(result.current.data?.messages).toHaveLength(2);
    expect(result.current.data?.messages[0].direction).toBe("outbound");
    expect(result.current.data?.messages[1].direction).toBe("inbound");
  });

  it("returns null data when lead has no conversation (404)", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "No conversation found for this lead" }),
    } as Response);

    const { result } = renderHook(() => useLeadConversation("lead404"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("throws on non-404 errors", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    } as Response);

    const { result } = renderHook(() => useLeadConversation("lead500"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
