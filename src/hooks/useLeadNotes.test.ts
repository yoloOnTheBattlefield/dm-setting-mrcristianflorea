import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useLeadNotes,
  useCreateLeadNote,
  useDeleteLeadNote,
  useOutboundLeadNotes,
  useCreateOutboundLeadNote,
} from "./useLeadNotes";

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

const mockNotes = [
  {
    _id: "note1",
    lead_id: "lead1",
    outbound_lead_id: null,
    account_id: "acc1",
    author_id: "user1",
    author_name: "John",
    content: "First note",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "note2",
    lead_id: "lead1",
    outbound_lead_id: null,
    account_id: "acc1",
    author_id: "user1",
    author_name: "John",
    content: "Second note",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
];

describe("useLeadNotes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not fetch when leadId is undefined", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLeadNotes(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  it("fetches notes for a given lead", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotes,
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLeadNotes("lead1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/api/lead-notes?lead_id=lead1",
    );
  });
});

describe("useCreateLeadNote (optimistic)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds optimistic note and replaces on success", async () => {
    vi.mocked(fetchWithAuth)
      // initial query fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockNotes } as Response)
      // mutation response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: "note3",
          lead_id: "lead1",
          outbound_lead_id: null,
          account_id: "acc1",
          author_id: "user1",
          author_name: "John",
          content: "New note",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      } as Response)
      // refetch after invalidation
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          ...mockNotes,
          {
            _id: "note3",
            lead_id: "lead1",
            outbound_lead_id: null,
            account_id: "acc1",
            author_id: "user1",
            author_name: "John",
            content: "New note",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      } as Response);

    const { wrapper, qc } = createWrapper();

    // Pre-seed the cache
    qc.setQueryData(["lead-notes", "lead1"], mockNotes);

    const { result } = renderHook(() => useCreateLeadNote(), { wrapper });

    await act(async () => {
      result.current.mutate({ lead_id: "lead1", content: "New note" });
    });

    // After mutation the cache should eventually have 3 notes
    await waitFor(() => {
      const cached = qc.getQueryData<typeof mockNotes>(["lead-notes", "lead1"]);
      expect(cached?.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("useDeleteLeadNote (optimistic)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes note optimistically from cache", async () => {
    vi.mocked(fetchWithAuth)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ deleted: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockNotes[1]] } as Response);

    const { wrapper, qc } = createWrapper();
    qc.setQueryData(["lead-notes", "lead1"], mockNotes);

    const { result } = renderHook(() => useDeleteLeadNote(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "note1", lead_id: "lead1" });
    });

    // Optimistic removal should happen immediately
    await waitFor(() => {
      const cached = qc.getQueryData<typeof mockNotes>(["lead-notes", "lead1"]);
      expect(cached?.find((n) => n._id === "note1")).toBeUndefined();
    });
  });
});

describe("useOutboundLeadNotes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches notes for outbound lead", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useOutboundLeadNotes("ob1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "http://localhost:3000/api/lead-notes?outbound_lead_id=ob1",
    );
  });
});

describe("useCreateOutboundLeadNote (optimistic)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds optimistic note to outbound cache", async () => {
    vi.mocked(fetchWithAuth)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ _id: "newnote" }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [{ _id: "newnote" }] } as Response);

    const { wrapper, qc } = createWrapper();
    qc.setQueryData(["lead-notes-outbound", "ob1"], []);

    const { result } = renderHook(() => useCreateOutboundLeadNote(), { wrapper });

    await act(async () => {
      result.current.mutate({ outbound_lead_id: "ob1", content: "Test" });
    });

    await waitFor(() => {
      const cached = qc.getQueryData<unknown[]>(["lead-notes-outbound", "ob1"]);
      expect(cached?.length).toBeGreaterThanOrEqual(1);
    });
  });
});
