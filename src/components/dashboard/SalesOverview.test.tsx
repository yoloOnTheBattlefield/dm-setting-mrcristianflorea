import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SalesOverview } from "./SalesOverview";
import { SalesMetrics } from "@/lib/types";

const mockMetrics: SalesMetrics = {
  total_bookings: 25,
  overall_close_rate: 48.5,
  overall_show_up_rate: 72.3,
  total_revenue: 12500,
  avg_deal_value: 2500,
  by_source: [
    { source: "youtube", bookings: 12, completed: 6, close_rate: 54.5, show_up_rate: 80, revenue: 7500 },
    { source: "ig", bookings: 8, completed: 3, close_rate: 42.9, show_up_rate: 60, revenue: 3500 },
    { source: "email", bookings: 5, completed: 2, close_rate: 40, show_up_rate: 66.7, revenue: 1500 },
  ],
  by_medium: [
    { medium: "how-to-build-saas", source: "youtube", bookings: 5, completed: 3, close_rate: 60, revenue: 4000 },
    { medium: "launch-newsletter", source: "email", bookings: 3, completed: 1, close_rate: 33.3, revenue: 1000 },
  ],
};

// Mock recharts to avoid SVG rendering issues in tests
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("SalesOverview", () => {
  it("renders KPI cards with correct values", () => {
    render(<SalesOverview metrics={mockMetrics} />);

    expect(screen.getByText("Sales Performance")).toBeInTheDocument();
    expect(screen.getByText("48.5%")).toBeInTheDocument();
    expect(screen.getByText("72.3%")).toBeInTheDocument();
    expect(screen.getByText("$12.5k")).toBeInTheDocument();
    expect(screen.getByText("$2.5k")).toBeInTheDocument();
    expect(screen.getByText("Close Rate")).toBeInTheDocument();
    expect(screen.getByText("Show-up Rate")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Avg Deal Value")).toBeInTheDocument();
  });

  it("renders source breakdown list", () => {
    render(<SalesOverview metrics={mockMetrics} />);

    expect(screen.getByText("youtube")).toBeInTheDocument();
    expect(screen.getByText("ig")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();
    expect(screen.getByText("12 calls")).toBeInTheDocument();
    expect(screen.getByText("8 calls")).toBeInTheDocument();
  });

  it("renders top mediums section", () => {
    render(<SalesOverview metrics={mockMetrics} />);

    expect(screen.getByText("Top Mediums")).toBeInTheDocument();
    expect(screen.getByText("how-to-build-saas")).toBeInTheDocument();
    expect(screen.getByText("launch-newsletter")).toBeInTheDocument();
  });

  it("renders empty state when no source data", () => {
    const emptyMetrics: SalesMetrics = {
      total_bookings: 0,
      overall_close_rate: 0,
      overall_show_up_rate: 0,
      total_revenue: 0,
      avg_deal_value: 0,
      by_source: [],
      by_medium: [],
    };

    render(<SalesOverview metrics={emptyMetrics} />);

    expect(screen.getByText("No booking data yet.")).toBeInTheDocument();
    expect(screen.getByText("No source data.")).toBeInTheDocument();
  });
});
