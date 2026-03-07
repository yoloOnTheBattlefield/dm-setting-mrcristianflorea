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
    status: "new" as const,
    follow_up_date: null,
    note: "sent case study",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    lead: {
      username: "testuser",
      fullName: "Test User",
      followersCount: 5200,
      profileLink: "https://instagram.com/testuser",
      isVerified: false,
      replied_at: "2026-03-06T12:00:00Z",
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
      pagination: { page: 1, limit: 30, total: 1, totalPages: 1 },
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
    expect(screen.getByText("Sync Replies")).toBeInTheDocument();
  });

  it("renders pipeline stat cards", () => {
    renderPage();
    // "Need Follow-Up" appears in stat cards and tabs
    const needFollowUp = screen.getAllByText("Need Follow-Up");
    expect(needFollowUp.length).toBeGreaterThanOrEqual(1);
    // "Booked" appears in tabs and quick actions
    const booked = screen.getAllByText("Booked");
    expect(booked.length).toBeGreaterThanOrEqual(1);
  });

  it("renders pipeline tabs", () => {
    renderPage();
    expect(screen.getByText("All")).toBeInTheDocument();
    // These appear in multiple places (tabs + quick actions)
    const hotLead = screen.getAllByText("Hot Lead");
    expect(hotLead.length).toBeGreaterThanOrEqual(1);
    const followedUp = screen.getAllByText("Followed Up");
    expect(followedUp.length).toBeGreaterThanOrEqual(1);
  });

  it("renders lead card with username and account", () => {
    renderPage();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("via @mybiz")).toBeInTheDocument();
  });

  it("renders quick filter chips", () => {
    renderPage();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due Today")).toBeInTheDocument();
    expect(screen.getByText("Replied <24h")).toBeInTheDocument();
  });

  it("renders reply urgency indicator", () => {
    renderPage();
    // "replied" text should appear with time ago
    const replyIndicators = screen.getAllByText(/replied/i);
    expect(replyIndicators.length).toBeGreaterThan(0);
  });

  it("renders DM copy button", () => {
    renderPage();
    expect(screen.getByText("DM")).toBeInTheDocument();
  });

  it("renders quick follow-up date chips on card", () => {
    renderPage();
    expect(screen.getByText("+1d")).toBeInTheDocument();
    expect(screen.getByText("+3d")).toBeInTheDocument();
    expect(screen.getByText("+7d")).toBeInTheDocument();
  });
});
