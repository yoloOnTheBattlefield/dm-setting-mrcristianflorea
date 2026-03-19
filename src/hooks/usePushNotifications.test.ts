import { renderHook, act } from "@testing-library/react";
import { usePushNotifications } from "./usePushNotifications";
import { fetchWithAuth } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  API_URL: "http://localhost:3000",
  fetchWithAuth: vi.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as ReturnType<typeof vi.fn>;

function setupPushManager(hasExistingSub = false) {
  const mockGetSubscription = vi.fn().mockResolvedValue(hasExistingSub ? { endpoint: "https://ep" } : null);
  const mockSubscribe = vi.fn().mockResolvedValue({
    endpoint: "https://ep",
    toJSON: () => ({ keys: { p256dh: "abc", auth: "xyz" } }),
  });
  const mockUnsubscribe = vi.fn().mockResolvedValue(true);

  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      ready: Promise.resolve({
        pushManager: { getSubscription: mockGetSubscription, subscribe: mockSubscribe },
      }),
      register: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, "PushManager", { value: {}, writable: true });

  return { mockGetSubscription, mockSubscribe, mockUnsubscribe };
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithAuth.mockResolvedValue({ json: async () => ({ publicKey: "vapidkey" }) });
  });

  it("reports as supported when serviceWorker and PushManager available", () => {
    setupPushManager();
    const { result } = renderHook(() => usePushNotifications());
    expect(result.current.isSupported).toBe(true);
  });

  it("detects existing subscription on mount", async () => {
    setupPushManager(true);
    const { result } = renderHook(() => usePushNotifications());
    await act(async () => {});
    expect(result.current.isSubscribed).toBe(true);
  });

  it("subscribe calls fetchWithAuth to save subscription", async () => {
    const { mockSubscribe } = setupPushManager(false);
    // Mock browser Notification API (not available in jsdom)
    const mockRequestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { requestPermission: mockRequestPermission });
    const { result } = renderHook(() => usePushNotifications());
    await act(async () => {
      await result.current.subscribe();
    });
    expect(mockSubscribe).toHaveBeenCalled();
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/push-subscriptions"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.isSubscribed).toBe(true);
  });
});
