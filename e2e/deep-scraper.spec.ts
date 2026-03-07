import { test, expect, Page } from "@playwright/test";
import { login } from "./helpers";

const API = "http://localhost:3000";

const jobs = [
  {
    _id: "job1",
    name: "Fitness Scrape",
    status: "completed",
    seed_usernames: ["fitnessguru", "gymlife"],
    direct_urls: [],
    scrape_type: "reels",
    mode: "outbound",
    stats: {
      total_scraped: 250,
      reels_scraped: 15,
      comments_scraped: 1200,
      profiles_scraped: 250,
      qualified: 80,
      messaged: 20,
      replied: 5,
      booked: 2,
      total_contract_value: 1000,
    },
    created_at: "2026-02-20T10:00:00Z",
    completed_at: "2026-02-20T12:00:00Z",
  },
  {
    _id: "job2",
    name: "Yoga Scrape",
    status: "scraping_comments",
    seed_usernames: ["yogawithanna"],
    direct_urls: [],
    scrape_type: "reels",
    mode: "outbound",
    stats: {
      total_scraped: 50,
      reels_scraped: 5,
      comments_scraped: 300,
      profiles_scraped: 50,
      qualified: 10,
      messaged: 0,
      replied: 0,
      booked: 0,
      total_contract_value: 0,
    },
    created_at: "2026-03-05T08:00:00Z",
  },
];

const targetStats = {
  total_targets: 330,
  qualified_targets: 90,
};

async function stubApi(page: Page) {
  await page.route(`${API}/api/deep-scrape?*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        jobs,
        pagination: { total: 2, page: 1, totalPages: 1 },
      }),
    });
  });

  await page.route(`${API}/api/deep-scrape/target-stats*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(targetStats),
    });
  });

  await page.route(`${API}/api/deep-scrape/job1`, (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(jobs[0]),
      });
    } else {
      route.continue();
    }
  });

  await page.route(`${API}/api/deep-scrape/job1/leads*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          _id: "l1",
          username: "user_a",
          fullName: "User A",
          followersCount: 5000,
          qualified: true,
          bio: "Fitness",
        },
        {
          _id: "l2",
          username: "user_b",
          fullName: "User B",
          followersCount: 800,
          qualified: false,
          unqualified_reason: "low followers",
          bio: "Student",
        },
      ]),
    });
  });

  await page.route(`${API}/api/deep-scrape/job2`, (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(jobs[1]),
      });
    } else {
      route.continue();
    }
  });

  // Prompts for the create dialog
  await page.route(`${API}/prompts*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { _id: "p1", label: "Fitness Prompt", text: "Are they a fitness creator?" },
      ]),
    });
  });
}

test.describe("Deep Scraper Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await stubApi(page);
    await page.goto("/deep-scraper");
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/deep-scrape") && resp.status() === 200
    );
  });

  test("renders the page header and job list", async ({ page }) => {
    await expect(page.getByText("Deep Scraper")).toBeVisible();
    await expect(page.getByText("Fitness Scrape")).toBeVisible();
    await expect(page.getByText("Yoga Scrape")).toBeVisible();
  });

  test("shows job status badges", async ({ page }) => {
    await expect(page.getByText(/completed/i)).toBeVisible();
  });

  test("starts a new scrape job with seed usernames", async ({ page }) => {
    await page.route(`${API}/api/deep-scrape/start`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "job3",
            name: "New Scrape",
            status: "pending",
            seed_usernames: ["newaccount"],
            stats: {},
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // Open create dialog
    await page.getByText(/new|start|create/i).first().click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator("input").first().clear();
    await dialog.locator("input").first().fill("New Scrape");
    await dialog.locator("textarea").first().fill("newaccount");
    await dialog.getByText(/start|create|save/i).click();

    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/deep-scrape/start") &&
        resp.request().method() === "POST" &&
        resp.status() === 201
    );
  });

  test("starts a new scrape job with direct URLs", async ({ page }) => {
    await page.route(`${API}/api/deep-scrape/start`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "job4",
            name: "URL Scrape",
            status: "pending",
            direct_urls: ["https://instagram.com/reel/abc123"],
            stats: {},
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.getByText(/new|start|create/i).first().click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator("input").first().clear();
    await dialog.locator("input").first().fill("URL Scrape");

    // Switch to direct URL mode if toggle exists
    const dialogText = await dialog.textContent();
    if (dialogText && /url|direct/i.test(dialogText)) {
      await dialog.getByText(/url|direct/i).click();
    }

    await dialog.locator("textarea").first().clear();
    await dialog.locator("textarea").first().fill("https://instagram.com/reel/abc123");
    await dialog.getByText(/start|create|save/i).click();

    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/deep-scrape/start") &&
        resp.request().method() === "POST" &&
        resp.status() === 201
    );
  });

  test("pauses a running job", async ({ page }) => {
    await page.route(`${API}/api/deep-scrape/job2/pause`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...jobs[1], status: "paused" }),
      });
    });

    // Find the running job row and click pause or open menu
    const yogaRow = page
      .getByText("Yoga Scrape")
      .locator("xpath=ancestor::tr | ancestor::div[contains(@class,'card')] | ancestor::div[contains(@class,'row')]")
      .first();

    const buttons = yogaRow.locator("button");
    const pauseBtn = yogaRow.locator(
      "button:has-text('Pause'), [aria-label*='pause'], [title*='Pause']"
    );

    if (await pauseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pauseBtn.first().click();
    } else {
      await buttons.last().click();
    }

    // If pause is in a dropdown menu
    const menu = page.locator('[role="menu"]');
    if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menu.getByText(/pause/i).click();
    }

    await page.waitForResponse((resp) =>
      resp.url().includes("/deep-scrape/job2/pause") && resp.status() === 200
    );
  });

  test("cancels a running job", async ({ page }) => {
    await page.route(`${API}/api/deep-scrape/job2/cancel`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...jobs[1], status: "cancelled" }),
      });
    });

    const yogaRow = page
      .getByText("Yoga Scrape")
      .locator("xpath=ancestor::tr | ancestor::div[contains(@class,'card')] | ancestor::div[contains(@class,'row')]")
      .first();

    await yogaRow.locator("button").last().click();

    const menu = page.locator('[role="menu"]');
    if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menu.getByText(/cancel/i).click();
    }

    // Confirm if dialog appears
    const alertDialog = page.locator('[role="alertdialog"]');
    if (await alertDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await alertDialog.getByText(/cancel|confirm|yes/i).click();
    }

    await page.waitForResponse((resp) =>
      resp.url().includes("/deep-scrape/job2/cancel") && resp.status() === 200
    );
  });

  test("deletes a completed job", async ({ page }) => {
    await page.route(`${API}/api/deep-scrape/job1`, (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ deleted: true }),
        });
      } else {
        route.continue();
      }
    });

    const fitnessRow = page
      .getByText("Fitness Scrape")
      .locator("xpath=ancestor::tr | ancestor::div[contains(@class,'card')] | ancestor::div[contains(@class,'row')]")
      .first();

    await fitnessRow.locator("button").last().click();

    const menu = page.locator('[role="menu"]');
    if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menu.getByText(/delete/i).click();
    }

    // Confirm deletion
    const alertDialog = page.locator('[role="alertdialog"]');
    if (await alertDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await alertDialog.getByText(/delete|confirm|yes/i).click();
    }

    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/deep-scrape/job1") &&
        resp.request().method() === "DELETE" &&
        resp.status() === 200
    );
  });
});
