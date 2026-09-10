import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ZernioCard from "./ZernioCard";
import {
  useZernioStatus,
  useZernioProfiles,
  useZernioIgAccounts,
  useConnectZernio,
  useDisconnectZernio,
} from "@/hooks/useZernio";

vi.mock("@/hooks/useZernio", () => ({
  useZernioStatus: vi.fn(),
  useZernioProfiles: vi.fn(),
  useZernioIgAccounts: vi.fn(),
  useConnectZernio: vi.fn(),
  useDisconnectZernio: vi.fn(),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const mockStatus = vi.mocked(useZernioStatus);
const mockProfiles = vi.mocked(useZernioProfiles);
const mockAccounts = vi.mocked(useZernioIgAccounts);
const mockConnect = vi.mocked(useConnectZernio);
const mockDisconnect = vi.mocked(useDisconnectZernio);

const DISCONNECTED = {
  connected: false,
  has_api_key: false,
  profile_id: null,
  ig_user_id: null,
  ig_username: null,
  webhook_url: "https://crm.test/zernio-webhook/acct1",
  webhook_registered: false,
  connected_at: null,
};

let loadProfiles: ReturnType<typeof vi.fn>;
let loadAccounts: ReturnType<typeof vi.fn>;
let connectMutate: ReturnType<typeof vi.fn>;
let disconnectMutate: ReturnType<typeof vi.fn>;

function renderCard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ZernioCard />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  loadProfiles = vi.fn().mockResolvedValue({ profiles: [{ id: "p1", name: "Main" }] });
  loadAccounts = vi.fn().mockResolvedValue({
    accounts: [{ id: "zacct_1", ig_user_id: "ig1", username: "ourbrand", name: null }],
  });
  connectMutate = vi.fn().mockResolvedValue({ success: true, webhook_registered: true });
  disconnectMutate = vi.fn().mockResolvedValue({ success: true });

  mockStatus.mockReturnValue({ data: DISCONNECTED, isLoading: false } as never);
  mockProfiles.mockReturnValue({ mutateAsync: loadProfiles, isPending: false } as never);
  mockAccounts.mockReturnValue({ mutateAsync: loadAccounts, isPending: false } as never);
  mockConnect.mockReturnValue({ mutateAsync: connectMutate, isPending: false } as never);
  mockDisconnect.mockReturnValue({ mutateAsync: disconnectMutate, isPending: false } as never);
});

describe("ZernioCard", () => {
  it("shows as not connected and disables Load profiles until a key is typed", () => {
    renderCard();

    expect(screen.getByText("Not Connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load profiles/i })).toBeDisabled();
  });

  it("warns about double-DMs if Meta and Zernio both run", () => {
    renderCard();
    expect(screen.getByText(/two DMs/i)).toBeInTheDocument();
  });

  it("masks the API key input", () => {
    renderCard();
    expect(screen.getByLabelText("API key")).toHaveAttribute("type", "password");
  });

  it("loads profiles with the typed key", async () => {
    renderCard();

    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "zkey" } });
    fireEvent.click(screen.getByRole("button", { name: /load profiles/i }));

    await waitFor(() => expect(loadProfiles).toHaveBeenCalledWith({ api_key: "zkey" }));
    expect(await screen.findByLabelText("Profile")).toBeInTheDocument();
  });

  it("surfaces a bad key as a toast", async () => {
    loadProfiles.mockRejectedValue(new Error("The Zernio API key is invalid or expired."));
    renderCard();

    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: /load profiles/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Could not reach Zernio",
          description: "The Zernio API key is invalid or expired.",
        }),
      ),
    );
  });

  it("keeps Connect disabled until an Instagram account is picked", async () => {
    renderCard();

    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "zkey" } });
    fireEvent.click(screen.getByRole("button", { name: /load profiles/i }));
    await screen.findByLabelText("Profile");

    expect(screen.getByRole("button", { name: /connect zernio/i })).toBeDisabled();
  });

  it("renders the connected state with the bound handle", () => {
    mockStatus.mockReturnValue({
      data: {
        ...DISCONNECTED,
        connected: true,
        has_api_key: true,
        ig_username: "ourbrand",
        webhook_registered: true,
      },
      isLoading: false,
    } as never);

    renderCard();

    expect(screen.getByText("@ourbrand")).toBeInTheDocument();
    expect(screen.getByText(/webhook registered/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("API key")).not.toBeInTheDocument();
  });

  it("disconnects", async () => {
    mockStatus.mockReturnValue({
      data: { ...DISCONNECTED, connected: true, has_api_key: true, ig_username: "ourbrand" },
      isLoading: false,
    } as never);

    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /disconnect zernio/i }));

    await waitFor(() => expect(disconnectMutate).toHaveBeenCalled());
  });
});
