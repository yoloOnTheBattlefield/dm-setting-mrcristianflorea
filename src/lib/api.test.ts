import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithAuth, extractErrorMessage } from "./api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.setItem("token", "test-token");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("fetchWithAuth", () => {
  it("attaches Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await fetchWithAuth("http://localhost/test");
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("throws on 401 and clears auth state", async () => {
    mockFetch.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(fetchWithAuth("http://localhost/test")).rejects.toThrow("Session expired");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("retries on 500 for GET requests", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const res = await fetchWithAuth("http://localhost/test");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry mutations", async () => {
    mockFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const res = await fetchWithAuth("http://localhost/test", { method: "POST" });
    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries on network error for GET", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const res = await fetchWithAuth("http://localhost/test");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("extractErrorMessage", () => {
  it("extracts error field from JSON response", async () => {
    const res = new Response(JSON.stringify({ error: "Bad input" }), { status: 400 });
    expect(await extractErrorMessage(res, "fallback")).toBe("Bad input");
  });

  it("extracts message field from JSON response", async () => {
    const res = new Response(JSON.stringify({ message: "Not found" }), { status: 404 });
    expect(await extractErrorMessage(res, "fallback")).toBe("Not found");
  });

  it("returns fallback for non-JSON response", async () => {
    const res = new Response("plain text", { status: 500 });
    expect(await extractErrorMessage(res, "Something failed")).toBe("Something failed");
  });
});
