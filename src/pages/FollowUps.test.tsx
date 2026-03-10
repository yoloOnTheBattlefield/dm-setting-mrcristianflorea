import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import FollowUps from "./FollowUps";

const mockFollowUps = [
  {
    _id: "fu1",
    outbound_lead_id: "ol1",
    account_id: "a1",
    outbound_account_id: "oa1",
    status: "need_reply" as const,
    follow_up_date: null,
    note: "sent case study",
    last_activity: "2026-03-10T12:00:00Z",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    lead: {
      username: "testuser",
      fullName: "Test User",
      followersCount: 5200,
      profileLink: "https://instagram.com/testuser",
      isVerified: false,
      replied_at: "2026-03-06T12:00:00Z",
      dmDate: null,
      message: null,
      source_seeds: [],
    },
    outbound_account: { username: "mybiz" },
  },
];

const mockStats = {
  total: 10,
  need_reply: 3,
  hot_lead: 1,
  follow_up_later: 2,
  waiting_for_them: 1,
  booked: 1,
  not_interested: 1,
};

vi.mock("@/hooks/useFollowUps", () => ({
  useFollowUps: () => ({
    data: {
      followUps: mockFollowUps,
      pagination: { page: 1, limit: 200, total: 1, totalPages: 1 },
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
  it("renders header", () => {
    renderPage();
    expect(screen.getByText("Follow-Ups")).toBeInTheDocument();
  });

  it("renders kanban column headers", () => {
    renderPage();
    expect(screen.getByText("Need Reply")).toBeInTheDocument();
    const hotLeads = screen.getAllByText("Hot Leads");
    expect(hotLeads.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Follow Up Later")).toBeInTheDocument();
    expect(screen.getByText("Waiting For Them")).toBeInTheDocument();
  });

  it("renders lead card with username and account", () => {
    renderPage();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("via @mybiz")).toBeInTheDocument();
  });

  it("renders activity indicator", () => {
    renderPage();
    const activityIndicators = screen.getAllByText(/since activity|Active today|No activity/i);
    expect(activityIndicators.length).toBeGreaterThan(0);
  });

  it("renders Reply button", () => {
    renderPage();
    expect(screen.getByText("Reply")).toBeInTheDocument();
  });

  it("renders quick follow-up date chips on card", () => {
    renderPage();
    expect(screen.getByText("+1d")).toBeInTheDocument();
    expect(screen.getByText("+3d")).toBeInTheDocument();
    expect(screen.getByText("+7d")).toBeInTheDocument();
  });

  it("renders column counts from stats", () => {
    renderPage();
    // The "3" count for "need_reply" column
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPage();
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders header summary with total count", () => {
    renderPage();
    expect(screen.getByText("10 total")).toBeInTheDocument();
  });
});
