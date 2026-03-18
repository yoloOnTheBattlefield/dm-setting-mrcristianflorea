import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock recharts to avoid rendering issues in test env
vi.mock("recharts", () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Legend: () => null,
}));

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: vi.fn(),
}));

vi.mock("@/hooks/usePersistedState", () => ({
  usePersistedState: (key: string, defaultVal: any) => {
    const [state, setState] = React.useState(defaultVal);
    return [state, setState];
  },
}));

import { fetchWithAuth } from "@/lib/api";
import InboundAnalytics from "./InboundAnalytics";

const mockedFetch = fetchWithAuth as ReturnType<typeof vi.fn>;

function mockOverview(overrides = {}) {
  return {
    total: 100,
    booked: 20,
    closed: 5,
    book_rate: 20.0,
    close_rate: 25.0,
    revenue: 10000,
    cross_channel: 0,
    cross_channel_rate: 0,
    sources: [
      { source: "instagram", total: 60, booked: 15, closed: 3, revenue: 7000 },
      { source: "tiktok", total: 40, booked: 5, closed: 2, revenue: 3000 },
    ],
    ...overrides,
  };
}

function mockPosts(posts = []) {
  return { posts };
}

function mockDaily(days = []) {
  return { days };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InboundAnalytics />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("InboundAnalytics", () => {
  it("renders loading skeleton initially", () => {
    mockedFetch.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Page title should still render
    expect(screen.getByText("Inbound Analytics")).toBeInTheDocument();
  });

  it("renders KPI cards with correct values", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({ ok: true, json: () => mockPosts() });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({ ok: true, json: () => mockOverview() });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
    });
    expect(screen.getAllByText("20").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("20.0%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("shows source breakdown table with conversion rates when real sources exist", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({ ok: true, json: () => mockPosts() });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({ ok: true, json: () => mockOverview() });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("instagram")).toBeInTheDocument();
    });
    expect(screen.getByText("tiktok")).toBeInTheDocument();
    // Conversion rate columns should be present (KPI card + table header)
    expect(screen.getAllByText("Book Rate").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Close Rate")).toBeInTheDocument();
  });

  it("shows empty state for source breakdown when all sources are unknown", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({ ok: true, json: () => mockPosts() });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({
          ok: true,
          json: () =>
            mockOverview({
              sources: [{ source: "unknown", total: 100, booked: 20, closed: 5, revenue: 10000 }],
            }),
        });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No UTM source data detected.")).toBeInTheDocument();
    });
  });

  it("shows empty state for posts when only unknown posts exist", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({
          ok: true,
          json: () =>
            mockPosts([
              { post_url: "unknown", total: 50, booked: 10, closed: 2, book_rate: 20, close_rate: 20, revenue: 5000 },
            ]),
        });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({ ok: true, json: () => mockOverview() });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No post tracking data yet.")).toBeInTheDocument();
    });
    // Should show the unattributed count as a footnote
    expect(screen.getByText(/50 leads with no post attributed/)).toBeInTheDocument();
  });

  it("shows contextual subtitle when no attribution data exists", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({ ok: true, json: () => mockPosts() });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({
          ok: true,
          json: () =>
            mockOverview({
              sources: [{ source: "unknown", total: 100, booked: 20, closed: 5, revenue: 10000 }],
            }),
        });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Connect post tracking and UTM sources to unlock full attribution."),
      ).toBeInTheDocument();
    });
  });

  it("does not show cross-channel card when cross_channel is 0", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/analytics/inbound/posts"))
        return Promise.resolve({ ok: true, json: () => mockPosts() });
      if (url.includes("/analytics/inbound/daily"))
        return Promise.resolve({ ok: true, json: () => mockDaily() });
      if (url.includes("/analytics/inbound"))
        return Promise.resolve({ ok: true, json: () => mockOverview({ cross_channel: 0 }) });
      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
    });
    expect(screen.queryByText("Cross-Channel")).not.toBeInTheDocument();
  });
});
