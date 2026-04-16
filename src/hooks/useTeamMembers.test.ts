import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useUpdateTeamMember,
  useAddTeamMember,
} from "./useTeamMembers";

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "@/lib/api";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
    qc,
  };
}

describe("useUpdateTeamMember — cross-account admin fix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends account_id in PATCH body when provided", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ has_outbound: true }),
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTeamMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "member-user-id",
        body: { has_outbound: true, account_id: "client-account-id" },
      });
    });

    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/accounts/member-user-id",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ has_outbound: true, account_id: "client-account-id" }),
      }),
    );
  });

  it("sends role in PATCH body when changing member role", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 1 }),
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTeamMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "member-user-id",
        body: { role: 1, account_id: "client-account-id" },
      });
    });

    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/accounts/member-user-id",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ role: 1, account_id: "client-account-id" }),
      }),
    );
  });

  it("sends PATCH without account_id when not provided (same-account update)", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ has_outbound: true }),
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTeamMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "member-user-id",
        body: { has_outbound: true },
      });
    });

    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/accounts/member-user-id",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ has_outbound: true }),
      }),
    );
  });
});

describe("useAddTeamMember — cross-account admin fix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends account_id in POST body when provided", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: "new-member-id" }),
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddTeamMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        email: "new@client.com",
        password: "test123",
        first_name: "New",
        last_name: "Member",
        role: 2,
        has_outbound: true,
        account_id: "client-account-id",
      });
    });

    const call = vi.mocked(fetchWithAuth).mock.calls[0];
    const sentBody = JSON.parse(call[1]?.body as string);
    expect(sentBody.account_id).toBe("client-account-id");
    expect(sentBody.has_outbound).toBe(true);
  });
});
