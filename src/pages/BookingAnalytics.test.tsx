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
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
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
import BookingAnalytics from "./BookingAnalytics";

const mockedFetch = fetchWithAuth as ReturnType<typeof vi.fn>;

function mockAnalytics(overrides = {}) {
  return {
    total: 10,
    close_rate: 60.0,
    show_up_rate: 75.0,
    avg_cash_collected: 2500,
    over_time: [
      { date: "2026-04-01", count: 3 },
      { date: "2026-04-02", count: 7 },
    ],
    source_distribution: [
      { source: "inbound", count: 4 },
      { source: "outbound", count: 6 },
    ],
    by_channel: [
      { channel: "Instagram", bookings: 5, completed: 3, no_show: 1, show_rate: 75.0, close_rate: 60.0, revenue: 7500 },
      { channel: "YouTube", bookings: 3, completed: 2, no_show: 0, show_rate: 100.0, close_rate: 66.67, revenue: 5000 },
      { channel: "LinkedIn", bookings: 2, completed: 1, no_show: 1, show_rate: 50.0, close_rate: 50.0, revenue: 2000 },
    ],
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BookingAnalytics />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("BookingAnalytics", () => {
  it("renders loading skeleton initially", () => {
    mockedFetch.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Booking Analytics")).toBeInTheDocument();
  });

  it("renders KPI cards with correct values", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => mockAnalytics(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("60.0%").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("75.0%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("$2,500")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
  });

  it("renders channel performance table with correct data", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => mockAnalytics(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Performance by Channel")).toBeInTheDocument();
    });

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();

    // Check revenue values are displayed
    expect(screen.getByText("$7,500")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("$2,000")).toBeInTheDocument();
  });

  it("does not render channel section when by_channel is empty", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => mockAnalytics({ by_channel: [] }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("60.0%")).toBeInTheDocument();
    });

    expect(screen.queryByText("Performance by Channel")).not.toBeInTheDocument();
  });

  it("renders date filter", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => mockAnalytics(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("30 days")).toBeInTheDocument();
    });
    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });
});
