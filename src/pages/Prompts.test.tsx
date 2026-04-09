import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Prompts from "./Prompts";
import { useAccountMe, useUpdateAccountTokens } from "@/hooks/useAccountMe";

vi.mock("@/hooks/useAccountMe", () => ({
  useAccountMe: vi.fn(() => ({ data: { openai_token: null }, isLoading: false })),
  useUpdateAccountTokens: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/hooks/usePrompts", () => ({
  usePrompts: () => ({ data: [], isLoading: false }),
  useCreatePrompt: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdatePrompt: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePrompt: () => ({ mutateAsync: vi.fn(), isPending: false }),
  DEFAULT_FILTERS: {
    minFollowers: 40000,
    minPosts: 10,
    excludePrivate: true,
    verifiedOnly: false,
    bioRequired: false,
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user1" } }),
}));

const mockUseAccountMe = vi.mocked(useAccountMe);
const mockUseUpdateAccountTokens = vi.mocked(useUpdateAccountTokens);

function renderPrompts() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Prompts />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Prompts — OpenAI key inline banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the API key banner when no openai_token is set", () => {
    mockUseAccountMe.mockReturnValue({ data: { openai_token: null }, isLoading: false } as any);
    mockUseUpdateAccountTokens.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
    renderPrompts();
    expect(screen.getByText("OpenAI API Key Missing")).toBeInTheDocument();
    expect(screen.getByLabelText("OpenAI API Key")).toBeInTheDocument();
  });

  it("hides the API key banner when openai_token is set", () => {
    mockUseAccountMe.mockReturnValue({ data: { openai_token: "sk-test" }, isLoading: false } as any);
    mockUseUpdateAccountTokens.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
    renderPrompts();
    expect(screen.queryByText("OpenAI API Key Missing")).not.toBeInTheDocument();
  });

  it("save button is disabled when input is empty", () => {
    mockUseAccountMe.mockReturnValue({ data: { openai_token: null }, isLoading: false } as any);
    mockUseUpdateAccountTokens.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
    renderPrompts();
    const saveBtn = screen.getByText("Save").closest("button");
    expect(saveBtn).toBeDisabled();
  });

  it("calls updateTokens mutation with entered key on save", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseAccountMe.mockReturnValue({ data: { openai_token: null }, isLoading: false } as any);
    mockUseUpdateAccountTokens.mockReturnValue({ mutateAsync, isPending: false } as any);
    renderPrompts();
    const input = screen.getByLabelText("OpenAI API Key");
    fireEvent.change(input, { target: { value: "sk-new-key" } });
    const saveBtn = screen.getByText("Save").closest("button")!;
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        accountId: "user1",
        body: { openai_token: "sk-new-key" },
      });
    });
  });
});
