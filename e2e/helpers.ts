import { Page } from "@playwright/test";

export const testUser = {
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

export async function login(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem("isAuthenticated", "true");
    window.localStorage.setItem("user", JSON.stringify(user));
    window.localStorage.setItem("token", "fake-jwt-token");
  }, testUser);
}
