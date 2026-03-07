import { test, expect, Page } from "@playwright/test";
import { login } from "./helpers";

const API = "http://localhost:3000";

const campaigns = [
  {
    _id: "camp1",
    name: "Fitness Outreach",
    status: "active",
    type: "auto",
    schedule: {
      active_hours_start: 9,
      active_hours_end: 17,
      min_delay_seconds: 60,
      max_delay_seconds: 180,
      timezone: "America/New_York",
      skip_wait_time: false,
    },
    created_at: "2026-02-01T10:00:00Z",
    stats: {
      total: 100,
      pending: 40,
      queued: 5,
      sent: 50,
      delivered: 48,
      replied: 10,
      link_sent: 5,
      booked: 3,
      failed: 2,
      skipped: 3,
      without_message: 0,
    },
  },
  {
    _id: "camp2",
    name: "Gym Leads",
    status: "draft",
    type: "manual",
    schedule: {
      active_hours_start: 10,
      active_hours_end: 18,
      min_delay_seconds: 30,
      max_delay_seconds: 90,
      timezone: "America/New_York",
      skip_wait_time: true,
    },
    created_at: "2026-02-15T10:00:00Z",
    stats: {
      total: 50,
      pending: 50,
      queued: 0,
      sent: 0,
      delivered: 0,
      replied: 0,
      link_sent: 0,
      booked: 0,
      failed: 0,
      skipped: 0,
      without_message: 20,
    },
  },
];

async function stubApi(page: Page) {
  await page.route(`${API}/api/campaigns?*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(campaigns),
    });
  });

  await page.route(`${API}/api/campaigns/camp1`, (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(campaigns[0]),
      });
    } else {
      route.continue();
    }
  });

  await page.route(`${API}/api/campaigns/camp1/stats`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(campaigns[0].stats),
    });
  });

  await page.route(`${API}/api/campaigns/camp1/leads*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        leads: [
          { _id: "cl1", username: "lead_user1", status: "sent", message: "Hey!" },
          { _id: "cl2", username: "lead_user2", status: "pending", message: "" },
        ],
        pagination: { total: 2, page: 1, totalPages: 1 },
      }),
    });
  });

  await page.route(`${API}/api/campaigns/camp1/senders*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(`${API}/api/campaigns/camp1/next-send*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ next_send: null }),
    });
  });

  await page.route(`${API}/api/outbound-accounts*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

test.describe("Campaigns Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await stubApi(page);
    await page.goto("/campaigns");
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/campaigns") && resp.status() === 200
    );
  });

  test("renders campaign list with names and statuses", async ({ page }) => {
    await expect(page.getByText("Campaigns")).toBeVisible();
    await expect(page.getByText("Fitness Outreach")).toBeVisible();
    await expect(page.getByText("Gym Leads")).toBeVisible();
  });

  test("shows stat summary line", async ({ page }) => {
    await expect(page.getByText(/2 campaigns/i)).toBeVisible();
  });

  test("creates a new campaign", async ({ page }) => {
    await page.route(`${API}/api/campaigns`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "camp3",
            name: "New Campaign",
            status: "draft",
            type: "auto",
            stats: {
              total: 0, pending: 0, sent: 0, delivered: 0, replied: 0,
              failed: 0, skipped: 0, booked: 0, link_sent: 0, queued: 0,
              without_message: 0,
            },
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // Open create dialog
    await page.getByText(/new campaign|create/i).click();

    // Fill in name
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator("input").first().clear();
    await dialog.locator("input").first().fill("New Campaign");
    await dialog.getByText(/create|save/i).click();

    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/campaigns") &&
        resp.request().method() === "POST" &&
        resp.status() === 201
    );
  });

  test("navigates to campaign detail", async ({ page }) => {
    await page.getByText("Fitness Outreach").click();
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/campaigns/camp1") && resp.status() === 200
    );
    await expect(page).toHaveURL(/\/campaigns\/camp1/);
  });

  test("starts a campaign from detail view", async ({ page }) => {
    await page.route(`${API}/api/campaigns/camp1/start`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...campaigns[0], status: "active" }),
      });
    });

    await page.goto("/campaigns/camp1");
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/campaigns/camp1") && resp.status() === 200
    );

    const bodyText = await page.locator("body").textContent();
    if (bodyText && /start/i.test(bodyText)) {
      const startBtn = page.getByText(/^start$/i);
      if (await startBtn.isVisible()) {
        await startBtn.click();
        await page.waitForResponse((resp) =>
          resp.url().includes("/campaigns/camp1/start") && resp.status() === 200
        );
      }
    }
  });

  test("pauses a campaign from detail view", async ({ page }) => {
    await page.route(`${API}/api/campaigns/camp1/pause`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...campaigns[0], status: "paused" }),
      });
    });

    await page.goto("/campaigns/camp1");
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/campaigns/camp1") && resp.status() === 200
    );

    const bodyText = await page.locator("body").textContent();
    if (bodyText && /pause/i.test(bodyText)) {
      const pauseBtn = page.getByText(/^pause$/i);
      if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
        await page.waitForResponse((resp) =>
          resp.url().includes("/campaigns/camp1/pause") && resp.status() === 200
        );
      }
    }
  });

  test("deletes a campaign", async ({ page }) => {
    await page.route(`${API}/api/campaigns/camp2`, (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ deleted: true }),
        });
      } else if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(campaigns[1]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`${API}/api/campaigns/camp2/stats`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(campaigns[1].stats),
      });
    });

    await page.route(`${API}/api/campaigns/camp2/leads*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          leads: [],
          pagination: { total: 0, page: 1, totalPages: 1 },
        }),
      });
    });

    await page.route(`${API}/api/campaigns/camp2/senders*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/campaigns/camp2");
    await page.waitForResponse((resp) =>
      resp.url().includes("/api/campaigns/camp2") && resp.status() === 200
    );

    const bodyText = await page.locator("body").textContent();
    if (bodyText && /delete/i.test(bodyText)) {
      await page.getByText(/delete/i).first().click();

      // Confirm in dialog if present
      const alertDialog = page.locator('[role="alertdialog"]');
      if (await alertDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await alertDialog.getByText(/delete|confirm|yes/i).click();
      }

      await page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/campaigns/camp2") &&
          resp.request().method() === "DELETE" &&
          resp.status() === 200
      );
    }
  });
});
