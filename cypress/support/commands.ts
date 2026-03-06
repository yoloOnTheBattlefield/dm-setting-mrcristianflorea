declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", () => {
  const user = {
    id: "user123",
    account_id: "acc123",
    ghl: "ghl_test",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    name: "Test User",
    role: 1,
    has_outbound: true,
    has_research: true,
  };

  window.localStorage.setItem("isAuthenticated", "true");
  window.localStorage.setItem("user", JSON.stringify(user));
  window.localStorage.setItem("token", "fake-jwt-token");
});

export {};
