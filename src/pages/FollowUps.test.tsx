import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import FollowUps from "./FollowUps";

const mockFollowUps = [
  {
    _id: "fu1",
    outbound_lead_id: "ol1",
    account_id: "a1",
    outbound_account_id: "oa1",
    status: "new" as const,
    follow_up_date: null,
    note: "",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    lead: {
      username: "testuser",
      fullName: "Test User",
      followersCount: 5200,
      profileLink: "https://instagram.com/testuser",
      isVerified: false,
      replied_at: "2026-02-28T00:00:00Z",
      source_seeds: [],
    },
    outbound_account: { username: "mybiz" },
  },
];

const mockStats = {
  total: 10,
  new: 3,
  contacted: 2,
  interested: 1,
  not_interested: 1,
  booked: 1,
  no_response: 1,
  ghosted: 0,
  hot_lead: 1,
};

vi.mock("@/hooks/useFollowUps", () => ({
  useFollowUps: () => ({
    data: {
      followUps: mockFollowUps,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
  useFollowUpStats: () => ({ data: mockStats }),
  useSyncFollowUps: () => ({
    mutateAsync: vi.fn(() => Promise.resolve({ synced: 5 })),
    isPending: false,
  }),
  useUpdateFollowUp: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useOutboundAccounts", () => ({
  useOutboundAccounts: () => ({
    data: {
      accounts: [{ _id: "oa1", username: "mybiz" }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", account_id: "a1", role: 1, has_outbound: true },
  }),
}));

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  ),
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FollowUps />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FollowUps page", () => {
  it("renders header and sync button", () => {
    renderPage();
    expect(screen.getByText("Follow-Ups")).toBeInTheDocument();
    expect(screen.getByText("Sync from Campaigns")).toBeInTheDocument();
  });

  it("renders stats cards with correct values", () => {
    renderPage();
    expect(screen.getByText("Total Replied")).toBeInTheDocument();
    expect(screen.getByText("Need Follow-Up")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // total
    expect(screen.getByText("3")).toBeInTheDocument(); // new
  });

  it("renders lead row with username and account", () => {
    renderPage();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("via @mybiz")).toBeInTheDocument();
  });

  it("renders filter controls", () => {
    renderPage();
    expect(
      screen.getByPlaceholderText("Search username, name, or notes..."),
    ).toBeInTheDocument();
  });

  it("renders status pill for lead", () => {
    renderPage();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("shows result count", () => {
    renderPage();
    expect(screen.getByText("1 result")).toBeInTheDocument();
  });

  it("renders DM copy button", () => {
    renderPage();
    expect(screen.getByText("DM")).toBeInTheDocument();
  });
});
