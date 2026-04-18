import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OutboundLeadDetail from "./OutboundLeadDetail";

const mockFetchWithAuth = vi.fn();

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useLeadNotes", () => ({
  useOutboundLeadNotes: () => ({ data: [] }),
  useCreateOutboundLeadNote: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteLeadNote: () => ({ mutate: vi.fn() }),
}));

const baseLead = {
  _id: "ob1",
  account_id: "acc1",
  followingKey: "fk1",
  username: "janedoe",
  fullName: "Jane Doe",
  profileLink: null,
  isVerified: false,
  followersCount: 5200,
  bio: "Marketing expert",
  postsCount: 120,
  externalUrl: null,
  email: "jane@test.com",
  source: "competitor1",
  scrapeDate: null,
  ig: null,
  promptId: null,
  promptLabel: "Sales Intro",
  isMessaged: true,
  dmDate: "2026-03-15T10:00:00.000Z",
  message: "Hey Jane! Love your content.",
  ig_thread_id: null,
  link_sent: false,
  link_sent_at: null,
  replied: true,
  replied_at: "2026-03-16T08:00:00.000Z",
  booked: false,
  booked_at: null,
  contract_value: 2500,
  qualified: null,
  unqualified_reason: null,
  score: 8,
  ai_processed: true,
  ai_provider: "openai",
  ai_model: "gpt-4o",
  source_seeds: [],
  createdAt: "2026-03-10T00:00:00.000Z",
  updatedAt: "2026-03-16T08:00:00.000Z",
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/outbound-leads/ob1"]}>
        <Routes>
          <Route path="/outbound-leads/:id" element={<OutboundLeadDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAllFetches(lead = baseLead) {
  mockFetchWithAuth.mockImplementation((url: string) => {
    if (url.includes("/outbound-leads/ob1")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(lead) });
    }
    if (url.includes("/ig-conversations/by-lead/")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            conversation: { _id: "conv1" },
            messages: [
              {
                _id: "msg1",
                conversation_id: "conv1",
                account_id: "acc1",
                direction: "outbound",
                sender_id: "s1",
                recipient_id: "r1",
                message_text: "Hey Jane!",
                message_id: "m1",
                timestamp: "2026-03-15T10:00:00.000Z",
                created_at: "2026-03-15T10:00:00.000Z",
              },
              {
                _id: "msg2",
                conversation_id: "conv1",
                account_id: "acc1",
                direction: "inbound",
                sender_id: "r1",
                recipient_id: "s1",
                message_text: "Thanks! Tell me more.",
                message_id: "m2",
                timestamp: "2026-03-16T08:00:00.000Z",
                created_at: "2026-03-16T08:00:00.000Z",
              },
            ],
            total: 2,
            page: 1,
            limit: 50,
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

describe("OutboundLeadDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders lead header with name, username, and score", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    expect(screen.getAllByText("@janedoe").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("8/10").length).toBeGreaterThanOrEqual(1);
  });

  it("shows contact sidebar info", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("jane@test.com").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("5.2K")).toBeInTheDocument();
    expect(screen.getByText("competitor1")).toBeInTheDocument();
    expect(screen.getByText("Sales Intro")).toBeInTheDocument();
  });

  it("renders pipeline stages", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    // Pipeline stage labels are in span.hidden.sm:inline — use getAllByText for duplicates
    const stageLabels = ["New", "Messaged", "Replied", "Link Sent", "Booked"];
    for (const label of stageLabels) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("shows DM conversation messages", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Hey Jane!")).toBeInTheDocument();
    });
    expect(screen.getByText("Thanks! Tell me more.")).toBeInTheDocument();
  });

  it("shows bio card", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Marketing expert")).toBeInTheDocument();
    });
  });

  it("shows contract value in deal section", async () => {
    mockAllFetches();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("$2,500")).toBeInTheDocument();
    });
  });

  it("shows DQ badge when disqualified", async () => {
    mockAllFetches({ ...baseLead, qualified: false, unqualified_reason: "Not a fit" });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Disqualified")).toBeInTheDocument();
    });
    expect(screen.getByText("Not a fit")).toBeInTheDocument();
  });

  it("shows link_sent_at timestamp in sidebar when link_sent is true", async () => {
    mockAllFetches({
      ...baseLead,
      link_sent: true,
      link_sent_at: "2026-03-17T14:00:00.000Z",
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    // "Link Sent" appears in both the pipeline stepper AND the sidebar timestamp row
    const linkSentElements = screen.getAllByText("Link Sent");
    expect(linkSentElements.length).toBe(2);
  });

  it("does not show link_sent_at row when link_sent is false", async () => {
    mockAllFetches({ ...baseLead, link_sent: false, link_sent_at: null });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    // "Link Sent" only appears once — in the pipeline stepper, not as a sidebar row
    const linkSentElements = screen.getAllByText("Link Sent");
    expect(linkSentElements.length).toBe(1);
  });

  it("shows error state for missing lead", async () => {
    mockFetchWithAuth.mockImplementation((url: string) => {
      if (url.includes("/outbound-leads/ob1")) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Lead not found")).toBeInTheDocument();
    });
  });
});
