import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

function TestConsumer() {
  const { isAuthenticated, user, accounts, login, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.name || "none"}</span>
      <span data-testid="accounts">{accounts.length}</span>
      <button onClick={() => login("test@test.com", "John", "Doe", "u1", "a1", undefined, 1, undefined, true, "tok123", true, [{ account_id: "a1", name: "Acme", role: 1, has_outbound: true, has_research: true, is_default: true }])}>
        Login
      </button>
      <button onClick={() => updateUser({ firstName: "Jane" })}>Update</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(screen.getByTestId("name").textContent).toBe("none");
  });

  it("login sets user and auth state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    act(() => {
      screen.getByText("Login").click();
    });
    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(screen.getByTestId("name").textContent).toBe("John Doe");
    expect(screen.getByTestId("accounts").textContent).toBe("1");
    expect(localStorage.getItem("token")).toBe("tok123");
    expect(localStorage.getItem("isAuthenticated")).toBe("true");
  });

  it("updateUser updates name fields", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    act(() => screen.getByText("Login").click());
    act(() => screen.getByText("Update").click());
    expect(screen.getByTestId("name").textContent).toBe("Jane Doe");
  });

  it("logout clears state and localStorage", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    act(() => screen.getByText("Login").click());
    act(() => screen.getByText("Logout").click());
    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(screen.getByTestId("name").textContent).toBe("none");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("isAuthenticated")).toBeNull();
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", JSON.stringify({
      email: "stored@test.com",
      firstName: "Stored",
      lastName: "User",
      name: "Stored User",
    }));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(screen.getByTestId("name").textContent).toBe("Stored User");
  });

  it("throws when useAuth used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    spy.mockRestore();
  });
});
