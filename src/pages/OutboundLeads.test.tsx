import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import OutboundLeads, { buildStatusPatch } from "./OutboundLeads";

const MOCK_LEAD = {
  _id: "ol1",
  followingKey: "testlead",
  username: "testlead",
  fullName: "Test Lead",
  profileLink: "https://instagram.com/testlead",
  isVerified: false,
  followersCount: 1500,
  bio: "Test bio",
  postsCount: 42,
  source: "scrape:seed",
  isMessaged: true,
  replied: false,
  link_sent: false,
  booked: false,
};

const MOCK_STATS = {
  total: 1, messaged: 1, replied: 0, link_sent: 0, booked: 0, dq: 0, contracts: 0, contract_value: 0,
};

function defaultMockImpl(url: string, opts?: { method?: string }) {
  if (opts?.method === "PATCH") {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }
  const u = String(url);
  if (u.includes("/stats")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_STATS) });
  }
  if (u.includes("/sources")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ sources: ["scrape:seed"] }) });
  }
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        leads: [MOCK_LEAD],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        funnel: { total: 1, messaged: 1, replied: 0, link_sent: 0, booked: 0, converted: 0 },
      }),
  });
}

const mockFetchWithAuth = vi.fn(defaultMockImpl);

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({
    data: [{ _id: "p1", label: "Default Prompt" }],
    isLoading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", account_id: "a1", role: 1, has_outbound: true },
  }),
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>
          <OutboundLeads />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OutboundLeads page", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockClear();
    mockFetchWithAuth.mockImplementation(defaultMockImpl);
  });

  it("renders page header", () => {
    renderPage();
    expect(screen.getByText("Outbound Leads")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPage();
    const inputs = screen.getAllByPlaceholderText(/search/i);
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders import button", () => {
    renderPage();
    expect(screen.getByText(/import/i)).toBeInTheDocument();
  });

  it("renders status badge as clickable button", async () => {
    renderPage();
    await waitFor(() => {
      const allMessaged = screen.getAllByText("Messaged");
      const badgeButtons = allMessaged.filter((el) => el.closest("button"));
      expect(badgeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Kanban mode skips stage filters", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockClear();
    mockFetchWithAuth.mockImplementation(defaultMockImpl);
  });

  afterEach(() => {
    localStorage.clear();
  });

  /** Extract the URL string from the first leads-list fetch (skipping /stats and /sources calls). */
  function getLeadsFetchUrl(): string | undefined {
    const call = mockFetchWithAuth.mock.calls.find(
      ([url]: [string]) =>
        url.includes("/outbound-leads") &&
        !url.includes("/stats") &&
        !url.includes("/sources"),
    );
    return call?.[0] as string | undefined;
  }

  it("does not send stage filters (qualified, isMessaged, replied, booked) in kanban mode", async () => {
    // Seed localStorage so page opens in kanban mode with active stage filters
    localStorage.setItem("ob-viewMode", JSON.stringify("kanban"));
    localStorage.setItem("ob-qualified", JSON.stringify("false"));
    localStorage.setItem("ob-messaged", JSON.stringify("true"));
    localStorage.setItem("ob-replied", JSON.stringify("true"));
    localStorage.setItem("ob-booked", JSON.stringify("true"));

    renderPage();

    await waitFor(() => {
      const url = getLeadsFetchUrl();
      expect(url).toBeDefined();
    });

    const url = getLeadsFetchUrl()!;
    const params = new URL(url).searchParams;

    // Stage filters must NOT be present
    expect(params.has("qualified")).toBe(false);
    expect(params.has("isMessaged")).toBe(false);
    expect(params.has("replied")).toBe(false);
    expect(params.has("booked")).toBe(false);

    // Limit should be 500 for kanban
    expect(params.get("limit")).toBe("500");
  });

  it("sends stage filters in list mode", async () => {
    // Seed localStorage so page opens in list mode with active stage filters
    localStorage.setItem("ob-viewMode", JSON.stringify("list"));
    localStorage.setItem("ob-messaged", JSON.stringify("true"));

    renderPage();

    await waitFor(() => {
      const url = getLeadsFetchUrl();
      expect(url).toBeDefined();
    });

    const url = getLeadsFetchUrl()!;
    const params = new URL(url).searchParams;

    // Stage filter should be present in list mode
    expect(params.get("isMessaged")).toBe("true");
    expect(params.get("limit")).toBe("20");
  });

  it("still sends non-stage filters (source, promptLabel, search) in kanban mode", async () => {
    localStorage.setItem("ob-viewMode", JSON.stringify("kanban"));
    localStorage.setItem("ob-source", JSON.stringify("scrape:seed"));
    localStorage.setItem("ob-prompt", JSON.stringify("Default Prompt"));

    renderPage();

    await waitFor(() => {
      const url = getLeadsFetchUrl();
      expect(url).toBeDefined();
    });

    const url = getLeadsFetchUrl()!;
    const params = new URL(url).searchParams;

    // Non-stage filters must still be sent
    expect(params.get("source")).toBe("scrape:seed");
    expect(params.get("promptLabel")).toBe("Default Prompt");
  });
});

describe("buildStatusPatch", () => {
  it("sets all fields to false/null for 'new' stage", () => {
    const patch = buildStatusPatch("new");
    expect(patch).toEqual({
      isMessaged: false,
      dmDate: null,
      link_sent: false,
      replied: false,
      booked: false,
      qualified: null,
    });
  });

  it("sets only isMessaged for 'messaged' stage", () => {
    const patch = buildStatusPatch("messaged", "2026-01-01T00:00:00.000Z");
    expect(patch.isMessaged).toBe(true);
    expect(patch.dmDate).toBe("2026-01-01T00:00:00.000Z");
    expect(patch.link_sent).toBe(false);
    expect(patch.replied).toBe(false);
    expect(patch.booked).toBe(false);
    expect(patch.qualified).toBeNull();
  });

  it("generates a new dmDate when none exists for 'messaged'", () => {
    const before = new Date().toISOString();
    const patch = buildStatusPatch("messaged");
    expect(patch.isMessaged).toBe(true);
    expect(typeof patch.dmDate).toBe("string");
    expect(new Date(patch.dmDate as string).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it("sets messaged + link_sent for 'link_sent' stage", () => {
    const patch = buildStatusPatch("link_sent", "2026-01-01T00:00:00.000Z");
    expect(patch.isMessaged).toBe(true);
    expect(patch.link_sent).toBe(true);
    expect(patch.replied).toBe(false);
    expect(patch.booked).toBe(false);
    expect(patch.qualified).toBeNull();
  });

  it("sets messaged + link_sent + replied for 'replied' stage", () => {
    const patch = buildStatusPatch("replied", "2026-01-01T00:00:00.000Z");
    expect(patch.isMessaged).toBe(true);
    expect(patch.link_sent).toBe(true);
    expect(patch.replied).toBe(true);
    expect(patch.booked).toBe(false);
    expect(patch.qualified).toBeNull();
  });

  it("sets all pipeline fields for 'converted' stage", () => {
    const patch = buildStatusPatch("converted", "2026-01-01T00:00:00.000Z");
    expect(patch.isMessaged).toBe(true);
    expect(patch.link_sent).toBe(true);
    expect(patch.replied).toBe(true);
    expect(patch.booked).toBe(true);
    expect(patch.qualified).toBeNull();
  });

  it("only sets qualified=false for 'dq' stage", () => {
    const patch = buildStatusPatch("dq");
    expect(patch).toEqual({ qualified: false });
  });

  it("returns empty object for unknown stage", () => {
    const patch = buildStatusPatch("unknown");
    expect(patch).toEqual({});
  });
});
