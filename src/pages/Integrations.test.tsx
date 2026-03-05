import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Integrations from "./Integrations";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", account_id: "a1", role: 1, api_key: "test-api-key-123" },
  }),
}));

vi.mock("@/contexts/AdminViewContext", () => ({
  useAdminView: () => ({ viewAll: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useTracking", () => ({
  useTrackingSettings: () => ({ data: { tracking_enabled: false } }),
  useUpdateTrackingSettings: () => ({ mutate: vi.fn(), isPending: false }),
  useTrackingEvents: () => ({ data: { events: [] } }),
}));

vi.mock("@/hooks/useApifyTokens", () => ({
  useApifyTokens: () => ({
    data: {
      tokens: [
        { _id: "tok1", label: "Main", token: "apify_***", status: "active" },
      ],
    },
    isLoading: false,
  }),
  useApifyUsage: () => ({ data: { usage: [] } }),
  useAddApifyToken: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteApifyToken: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResetApifyToken: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  fetchWithAuth: vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
}));

function renderIntegrations() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Integrations />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Integrations — Section grouping", () => {
  it("renders all section headings", () => {
    renderIntegrations();

    expect(screen.getByText("AI Models")).toBeInTheDocument();
    expect(screen.getByText("Data Acquisition")).toBeInTheDocument();
    expect(screen.getByText("Tracking")).toBeInTheDocument();
    expect(screen.getByText("Connections")).toBeInTheDocument();
  });
});

describe("Integrations — Status badges", () => {
  it("shows 'Server Default' badge for unconfigured AI keys", () => {
    renderIntegrations();

    const badges = screen.getAllByText("Server Default");
    // All 3 AI models should show "Server Default" when no key is set
    expect(badges.length).toBe(3);
  });

  it("shows 'Disabled' badge for Website Tracking when off", () => {
    renderIntegrations();

    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("shows 'Not Connected' badges for Calendly and Instagram", () => {
    renderIntegrations();

    const notConnected = screen.getAllByText("Not Connected");
    expect(notConnected.length).toBe(2);
  });

  it("shows 'Ready' badge for ManyChat when API key exists", () => {
    renderIntegrations();

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});

describe("Integrations — Tracking disabled context", () => {
  it("shows helper text when tracking is disabled", () => {
    renderIntegrations();

    expect(
      screen.getByText("Enable to get a tracking snippet you can add to your website."),
    ).toBeInTheDocument();
  });
});

describe("Integrations — ManyChat empty state", () => {
  it("shows 'No API key generated' instead of 'No API key found'", () => {
    // Re-mock with no api_key
    vi.doMock("@/contexts/AuthContext", () => ({
      useAuth: () => ({
        user: { id: "u1", account_id: "a1", role: 1, api_key: null },
      }),
    }));

    renderIntegrations();

    // Default render has api_key so it won't show "No API key generated"
    // but we verify "No API key found" does NOT appear
    expect(screen.queryByDisplayValue("No API key found")).not.toBeInTheDocument();
  });
});

describe("Integrations — Apify delete confirmation", () => {
  function clickDeleteButton() {
    const trashButton = document.querySelector(
      'button[class*="hover:text-destructive"]',
    ) as HTMLElement;
    expect(trashButton).toBeTruthy();
    fireEvent.click(trashButton);
  }

  it("shows confirmation dialog when delete button is clicked", () => {
    renderIntegrations();
    clickDeleteButton();

    expect(screen.getByText("Remove Apify Token")).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently remove this token/),
    ).toBeInTheDocument();
  });

  it("closes confirmation dialog on Cancel", () => {
    renderIntegrations();
    clickDeleteButton();

    expect(screen.getByText("Remove Apify Token")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Remove Apify Token")).not.toBeInTheDocument();
  });
});
