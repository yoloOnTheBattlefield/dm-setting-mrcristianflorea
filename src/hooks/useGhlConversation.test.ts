import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useGhlConversation } from "./useGhlConversation";

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "@/lib/api";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

const mockResponse = {
  messages: [
    { _id: "ghl-0", role: "user", direction: "inbound", text: "Hello I need help" },
    { _id: "ghl-1", role: "bot", direction: "outbound", text: "Hi! How can I assist you?" },
    { _id: "ghl-2", role: "user", direction: "inbound", text: "I want to book a call" },
    { _id: "ghl-3", role: "bot", direction: "outbound", text: "Great, here is the link" },
  ],
  total: 4,
};

describe("useGhlConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when leadId is undefined", () => {
    const { result } = renderHook(() => useGhlConversation(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches and returns parsed GHL conversation", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useGhlConversation("lead123"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/leads/lead123/ghl-conversation"
    );
    expect(result.current.data?.messages).toHaveLength(4);
    expect(result.current.data?.messages[0].role).toBe("user");
    expect(result.current.data?.messages[1].role).toBe("bot");
    expect(result.current.data?.total).toBe(4);
  });

  it("returns empty messages on 404", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    } as Response);

    const { result } = renderHook(() => useGhlConversation("lead404"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.messages).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it("throws on non-404 errors", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    } as Response);

    const { result } = renderHook(() => useGhlConversation("lead500"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
