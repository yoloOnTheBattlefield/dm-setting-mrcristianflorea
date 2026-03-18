import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LeadDetail from "./LeadDetail";

const mockFetchWithAuth = vi.fn();

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { has_outbound: true } }),
}));

const baseLead = {
  _id: "lead1",
  account_id: "acc1",
  contact_id: "c1",
  first_name: "John",
  last_name: "Doe",
  email: "john@test.com",
  date_created: "2026-01-01T00:00:00.000Z",
  qualified_at: null,
  link_sent_at: null,
  booked_at: null,
  ghosted_at: null,
  follow_up_at: null,
  closed_at: null,
  outbound_lead_id: null,
};

function renderLeadDetail() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/leads/lead1"]}>
        <Routes>
          <Route path="/leads/:contactId" element={<LeadDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LeadDetail — Outbound Lead Linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows search input when no outbound lead is linked", async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(baseLead),
      })
      // auto-search by name fires on mount
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leads: [] }),
      });

    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Outbound Lead")).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText("Search outbound leads by username or name..."),
    ).toBeInTheDocument();
  });

  it("shows linked outbound lead with unlink button", async () => {
    const leadWithLink = { ...baseLead, outbound_lead_id: "ob1" };
    const outboundLead = {
      _id: "ob1",
      username: "fitness_guru",
      fullName: "Jane Smith",
      followersCount: 5000,
    };

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(leadWithLink),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(outboundLead),
      });

    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("@fitness_guru")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText(/5,000 followers/)).toBeInTheDocument();
    expect(screen.getByText("Unlink")).toBeInTheDocument();
  });

  it("searches outbound leads on typing", async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(baseLead),
      })
      // auto-search by name fires on mount
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leads: [] }),
      });

    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Outbound Lead")).toBeInTheDocument();
    });

    const searchResults = [
      { _id: "ob2", username: "test_user", fullName: "Test User", followersCount: 1000 },
    ];

    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ leads: searchResults }),
    });

    const input = screen.getByPlaceholderText("Search outbound leads by username or name...");
    fireEvent.change(input, { target: { value: "test_user" } });

    await waitFor(() => {
      expect(screen.getByText("@test_user")).toBeInTheDocument();
    });
  });

  it("links an outbound lead when clicking a search result", async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(baseLead),
      })
      // auto-search by name fires on mount
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leads: [] }),
      });

    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Outbound Lead")).toBeInTheDocument();
    });

    const searchResults = [
      { _id: "ob3", username: "link_me", fullName: "Link Me", followersCount: 500 },
    ];

    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ leads: searchResults }),
    });

    const input = screen.getByPlaceholderText("Search outbound leads by username or name...");
    fireEvent.change(input, { target: { value: "link_me" } });

    await waitFor(() => {
      expect(screen.getByText("@link_me")).toBeInTheDocument();
    });

    // Mock the PATCH call for linking
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...baseLead, outbound_lead_id: "ob3" }),
    });

    fireEvent.click(screen.getByText("@link_me"));

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "https://api.test/leads/lead1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ outbound_lead_id: "ob3" }),
        }),
      );
    });
  });
});
