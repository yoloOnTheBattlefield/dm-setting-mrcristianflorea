import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddLeadDialog from "./AddLeadDialog";

const mockApiPost = vi.fn();

vi.mock("@/lib/api", () => ({
  API_URL: "https://api.test",
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDialog(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onOpenChange = vi.fn();
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={qc}>
        <AddLeadDialog open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  };
}

describe("AddLeadDialog", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
  });

  it("renders the form when open", () => {
    renderDialog();
    expect(screen.getByText("Manually add a lead to the outbound pipeline.")).toBeInTheDocument();
    expect(screen.getByText("Username *")).toBeInTheDocument();
  });

  it("switches the handle label/hint when platform is LinkedIn", () => {
    renderDialog();
    // Default = Instagram
    expect(screen.getByText("Username *")).toBeInTheDocument();
    expect(screen.getByText("Without the leading @")).toBeInTheDocument();

    // Open the platform select and pick LinkedIn
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "LinkedIn" }));

    expect(screen.getByText("Vanity slug *")).toBeInTheDocument();
    expect(screen.getByText("From linkedin.com/in/{slug}")).toBeInTheDocument();
  });

  it("submits a LinkedIn lead with platform and username", async () => {
    mockApiPost.mockResolvedValueOnce({ _id: "1", username: "john-doe", platform: "linkedin" });
    const { onOpenChange } = renderDialog();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "LinkedIn" }));

    fireEvent.change(screen.getByPlaceholderText("john-doe-123"), {
      target: { value: "john-doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Lead/ }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "https://api.test/outbound-leads",
        expect.objectContaining({ platform: "linkedin", username: "john-doe" }),
      );
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("does not submit without a username", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Add Lead/ }));
    expect(mockApiPost).not.toHaveBeenCalled();
  });
});
