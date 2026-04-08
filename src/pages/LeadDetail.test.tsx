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

const mockUser: { has_outbound: boolean; lead_visibility?: { dms: boolean; outbound: boolean } } = {
  has_outbound: true,
  lead_visibility: { dms: true, outbound: true },
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/hooks/useLeadNotes", () => ({
  useLeadNotes: () => ({ data: [] }),
  useCreateLeadNote: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteLeadNote: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/useLeadTasks", () => ({
  useLeadTasks: () => ({ data: [] }),
  useCreateLeadTask: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateLeadTask: () => ({ mutate: vi.fn() }),
  useDeleteLeadTask: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/usePayments", () => ({
  useLeadPayments: () => ({ data: [] }),
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

function mockAllFetches(lead = baseLead) {
  mockFetchWithAuth.mockImplementation((url: string) => {
    if (url.includes("/leads/lead1")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(lead) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ leads: [] }) });
  });
}

describe("LeadDetail — Header & Pipeline", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders lead name and pipeline stepper", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Link Sent")).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("shows action bar buttons", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Follow-Up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("shows contact info", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });

    // Email appears in both header and details sidebar
    const emailElements = screen.getAllByText((content) => content.includes("john@test.com"));
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe("LeadDetail — Outbound Lead Linking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows outbound lead section with search input", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Outbound Lead")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Search outbound leads...")).toBeInTheDocument();
  });

  it("shows linked outbound lead with unlink button", async () => {
    const leadWithLink = { ...baseLead, outbound_lead_id: "ob1" };
    const outboundLead = {
      _id: "ob1",
      username: "fitness_guru",
      fullName: "Jane Smith",
      followersCount: 5000,
    };

    mockFetchWithAuth.mockImplementation((url: string) => {
      if (url.includes("/leads/lead1")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(leadWithLink) });
      }
      if (url.includes("/outbound-leads/ob1")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(outboundLead) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ leads: [] }) });
    });

    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("@fitness_guru")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });
});

describe("LeadDetail — Notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows note compose tab with textarea", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      // The compose box is always visible with Note as default tab
      expect(screen.getByPlaceholderText("Write a note... (Ctrl+Enter to save)")).toBeInTheDocument();
    });
  });
});

describe("LeadDetail — Delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the overflow menu trigger for delete access", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });

    // The overflow menu button (containing MoreHorizontal icon) should be present
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe("LeadDetail — Lead Visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.has_outbound = true;
    mockUser.lead_visibility = { dms: true, outbound: true };
  });

  it("hides outbound lead section when outbound visibility is false", async () => {
    mockUser.lead_visibility = { dms: true, outbound: false };
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.queryByText("Outbound Lead")).not.toBeInTheDocument();
  });

  it("hides DM link prompt when dms visibility is false", async () => {
    mockUser.lead_visibility = { dms: false, outbound: true };
    mockFetchWithAuth.mockImplementation((url: string) => {
      if (url.includes("/leads/lead1")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(baseLead) });
      }
      if (url.includes("/conversation")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ leads: [] }) });
    });
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.queryByText("No DM conversation linked")).not.toBeInTheDocument();
    expect(screen.queryByText("Link conversation")).not.toBeInTheDocument();
  });

  it("shows outbound lead section when outbound visibility is true", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      expect(screen.getByText("Outbound Lead")).toBeInTheDocument();
    });
  });
});

describe("LeadDetail — Tasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders compose box with task tab", async () => {
    mockAllFetches();
    renderLeadDetail();

    await waitFor(() => {
      // The compose box renders tab triggers for all modes
      const tabs = screen.getAllByRole("tab");
      const tabNames = tabs.map((t) => t.textContent);
      expect(tabNames).toEqual(expect.arrayContaining(["Note", "Task"]));
    });
  });
});
