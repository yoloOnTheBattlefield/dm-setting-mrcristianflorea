import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock hooks
vi.mock("@/hooks/useAdvisoryMetrics", () => ({
  useAdvisorySummary: () => ({
    data: {
      total_mrr: 50000,
      total_cash_collected: 120000,
      avg_show_rate: 0.75,
      avg_close_rate: 0.3,
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAdvisoryClients", () => ({
  useAdvisoryClients: () => ({
    data: {
      items: [
        {
          _id: "1",
          name: "Test Client",
          niche: "Fitness",
          monthly_revenue: 10000,
          runway: 5000,
          constraint_type: "delegation",
          status: "active",
          health: "green",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
  useCreateClient: () => ({ mutateAsync: vi.fn() }),
  useUpdateClient: () => ({ mutateAsync: vi.fn() }),
}));

import AdvisoryDashboard from "./AdvisoryDashboard";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, ui)
    )
  );
}

describe("AdvisoryDashboard", () => {
  it("renders stat cards with summary data", () => {
    renderWithProviders(React.createElement(AdvisoryDashboard));
    expect(screen.getByText("Total MRR")).toBeInTheDocument();
    expect(screen.getByText("Cash Collected")).toBeInTheDocument();
    expect(screen.getByText("Avg Show Rate")).toBeInTheDocument();
    expect(screen.getByText("Avg Close Rate")).toBeInTheDocument();
  });

  it("renders formatted stat values", () => {
    renderWithProviders(React.createElement(AdvisoryDashboard));
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("$120,000")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
  });

  it("renders client list", () => {
    renderWithProviders(React.createElement(AdvisoryDashboard));
    expect(screen.getByText("Test Client")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderWithProviders(React.createElement(AdvisoryDashboard));
    expect(screen.getByPlaceholderText("Search clients...")).toBeInTheDocument();
  });

  it("renders New Client button", () => {
    renderWithProviders(React.createElement(AdvisoryDashboard));
    expect(screen.getByText("New Client")).toBeInTheDocument();
  });
});
