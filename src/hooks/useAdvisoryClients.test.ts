import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock fetchWithAuth
const mockFetchWithAuth = vi.fn();
vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

import { useAdvisoryClients } from "./useAdvisoryClients";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAdvisoryClients", () => {
  it("passes pagination params to fetchWithAuth", async () => {
    const mockResponse = {
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    };
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useAdvisoryClients({ page: 2, limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetchWithAuth.mock.calls[0][0] as string;
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("limit=10");
  });

  it("passes search param when provided", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
    });

    const { result } = renderHook(
      () => useAdvisoryClients({ page: 1, limit: 20, search: "test" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockFetchWithAuth.mock.calls[0][0] as string;
    expect(calledUrl).toContain("search=test");
  });

  it("passes status and health filters", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
    });

    const { result } = renderHook(
      () =>
        useAdvisoryClients({
          page: 1,
          limit: 20,
          status: "active",
          health: "green",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockFetchWithAuth.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=active");
    expect(calledUrl).toContain("health=green");
  });

  it("throws when response is not ok", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(
      () => useAdvisoryClients({ page: 1, limit: 20 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("500");
  });
});
