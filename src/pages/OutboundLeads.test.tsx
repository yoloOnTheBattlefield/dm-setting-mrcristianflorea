import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import OutboundLeads from "./OutboundLeads";

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          leads: [
            {
              _id: "ol1",
              followingKey: "testlead",
              username: "testlead",
              fullName: "Test Lead",
              profileLink: "https://instagram.com/testlead",
              isVerified: false,
              followersCount: 1500,
              bio: "Test bio",
              postsCount: 42,
              source: "scrape:seed",
              isMessaged: true,
              replied: false,
              link_sent: false,
              booked: false,
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          funnel: { total: 1, messaged: 1, replied: 0, link_sent: 0, booked: 0, converted: 0 },
        }),
    }),
  ),
}));

vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({
    data: [{ _id: "p1", label: "Default Prompt" }],
    isLoading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", account_id: "a1", role: 1, has_outbound: true },
  }),
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>
          <OutboundLeads />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OutboundLeads page", () => {
  it("renders page header", () => {
    renderPage();
    expect(screen.getByText("Outbound Leads")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPage();
    const inputs = screen.getAllByPlaceholderText(/search/i);
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders import button", () => {
    renderPage();
    expect(screen.getByText(/import/i)).toBeInTheDocument();
  });
});
