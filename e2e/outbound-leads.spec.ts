import { test, expect, Page } from "@playwright/test";
import { login } from "./helpers";

const API = "http://localhost:3000";

const leads = [
  {
    _id: "lead1",
    username: "johndoe",
    fullName: "John Doe",
    followersCount: 5200,
    isVerified: false,
    bio: "Fitness coach | DM for collabs",
    source: "deep_scrape",
    promptLabel: "fitness",
    isMessaged: false,
    replied: false,
    link_sent: false,
    booked: false,
    contract_value: null,
  },
  {
    _id: "lead2",
    username: "janefitness",
    fullName: "Jane Fitness",
    followersCount: 12000,
    isVerified: true,
    bio: "Online trainer",
    source: "instagram_scraper",
    promptLabel: "gym",
    isMessaged: true,
    replied: true,
    link_sent: false,
    booked: false,
    contract_value: 500,
    message: "Hey Jane!",
    dmDate: "2026-03-01T10:00:00Z",
  },
];

const stats = {
  total: 2,
  messaged: 1,
  replied: 1,
  booked: 0,
  contracts: 0,
  contract_value: 500,
};

const sources = ["deep_scrape", "instagram_scraper"];

async function stubApi(page: Page) {
  await page.route(`${API}/outbound-leads?*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        leads,
        pagination: { total: 2, page: 1, totalPages: 1, limit: 20 },
      }),
    });
  });

  await page.route(`${API}/outbound-leads/stats*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stats),
    });
  });

  await page.route(`${API}/outbound-leads/sources*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sources),
    });
  });
}

test.describe("Outbound Leads Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await stubApi(page);
    await page.goto("/outbound-leads");
    await page.waitForResponse((resp) =>
      resp.url().includes("/outbound-leads") && resp.status() === 200
    );
  });

  test("renders the page header and leads table", async ({ page }) => {
    await expect(page.getByText("Outbound Leads")).toBeVisible();
    await expect(page.getByText("johndoe")).toBeVisible();
    await expect(page.getByText("janefitness")).toBeVisible();
  });

  test("displays funnel stats", async ({ page }) => {
    await expect(page.getByText("2")).toBeVisible();
  });

  test("searches leads by username", async ({ page }) => {
    const filtered = [leads[0]];

    await page.route(`${API}/outbound-leads?*search=john*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          leads: filtered,
          pagination: { total: 1, page: 1, totalPages: 1, limit: 20 },
        }),
      });
    });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill("john");

    await page.waitForResponse((resp) =>
      resp.url().includes("search=john") && resp.status() === 200
    );

    await expect(page.getByText("johndoe")).toBeVisible();
    await expect(page.getByText("janefitness")).not.toBeVisible();
  });

  test("paginates when there are multiple pages", async ({ page }) => {
    await page.route(`${API}/outbound-leads?*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          leads,
          pagination: { total: 40, page: 1, totalPages: 2, limit: 20 },
        }),
      });
    });

    await page.goto("/outbound-leads");
    await page.waitForResponse((resp) =>
      resp.url().includes("/outbound-leads") && resp.status() === 200
    );

    await page.route(`${API}/outbound-leads?*page=2*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          leads: [leads[0]],
          pagination: { total: 40, page: 2, totalPages: 2, limit: 20 },
        }),
      });
    });

    await page.getByText("Next").click();
    await page.waitForResponse((resp) =>
      resp.url().includes("page=2") && resp.status() === 200
    );
  });

  test("bulk deletes selected leads", async ({ page }) => {
    await page.route(`${API}/outbound-leads/bulk-delete`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ deletedCount: 1 }),
        });
      } else {
        route.continue();
      }
    });

    // Select the first lead checkbox
    const firstRow = page.locator("table tbody tr").first();
    await firstRow
      .locator('input[type="checkbox"], button[role="checkbox"]')
      .first()
      .click();

    // Click the delete button
    await page.getByText(/delete/i).click();

    // Confirm deletion in the dialog
    const dialog = page.locator('[role="alertdialog"]');
    await dialog.getByText(/delete|confirm|yes/i).click();

    await page.waitForResponse((resp) =>
      resp.url().includes("/bulk-delete") && resp.status() === 200
    );
  });

  test("updates a lead as messaged", async ({ page }) => {
    await page.route(`${API}/outbound-leads/lead1`, (route) => {
      if (route.request().method() === "PATCH") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...leads[0], isMessaged: true }),
        });
      } else {
        route.continue();
      }
    });

    // Click the messaged checkbox for the first lead (second checkbox, first is row-select)
    const firstRow = page.locator("table tbody tr").first();
    await firstRow
      .locator('input[type="checkbox"], button[role="checkbox"]')
      .nth(1)
      .click();

    await page.waitForResponse((resp) =>
      resp.url().includes("/outbound-leads/lead1") && resp.status() === 200
    );
  });
});
