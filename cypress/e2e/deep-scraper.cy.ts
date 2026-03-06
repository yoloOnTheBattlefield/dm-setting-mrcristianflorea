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

function stubApi() {
  cy.intercept("GET", `${API}/api/deep-scrape?*`, {
    statusCode: 200,
    body: { jobs, pagination: { total: 2, page: 1, totalPages: 1 } },
  }).as("getJobs");

  cy.intercept("GET", `${API}/api/deep-scrape/target-stats*`, {
    statusCode: 200,
    body: targetStats,
  }).as("getTargetStats");

  cy.intercept("GET", `${API}/api/deep-scrape/job1`, {
    statusCode: 200,
    body: jobs[0],
  }).as("getJob1");

  cy.intercept("GET", `${API}/api/deep-scrape/job1/leads*`, {
    statusCode: 200,
    body: [
      { _id: "l1", username: "user_a", fullName: "User A", followersCount: 5000, qualified: true, bio: "Fitness" },
      { _id: "l2", username: "user_b", fullName: "User B", followersCount: 800, qualified: false, unqualified_reason: "low followers", bio: "Student" },
    ],
  }).as("getJob1Leads");

  cy.intercept("GET", `${API}/api/deep-scrape/job2`, {
    statusCode: 200,
    body: jobs[1],
  }).as("getJob2");

  // Prompts for the create dialog
  cy.intercept("GET", `${API}/prompts*`, {
    statusCode: 200,
    body: [{ _id: "p1", label: "Fitness Prompt", text: "Are they a fitness creator?" }],
  }).as("getPrompts");
}

describe("Deep Scraper Page", () => {
  beforeEach(() => {
    cy.login();
    stubApi();
    cy.visit("/deep-scraper");
    cy.wait("@getJobs");
  });

  it("renders the page header and job list", () => {
    cy.contains("Deep Scraper").should("be.visible");
    cy.contains("Fitness Scrape").should("be.visible");
    cy.contains("Yoga Scrape").should("be.visible");
  });

  it("shows job status badges", () => {
    cy.contains(/completed/i).should("be.visible");
  });

  it("starts a new scrape job with seed usernames", () => {
    cy.intercept("POST", `${API}/api/deep-scrape/start`, {
      statusCode: 201,
      body: {
        _id: "job3",
        name: "New Scrape",
        status: "pending",
        seed_usernames: ["newaccount"],
        stats: {},
        created_at: new Date().toISOString(),
      },
    }).as("startScrape");

    // Open create dialog
    cy.contains(/new|start|create/i).first().click();

    cy.get('[role="dialog"]').within(() => {
      // Fill in name if input exists
      cy.get("input").first().clear().type("New Scrape");

      // Enter seed username in textarea
      cy.get("textarea").first().type("newaccount");

      // Submit
      cy.contains(/start|create|save/i).click();
    });

    cy.wait("@startScrape");
  });

  it("starts a new scrape job with direct URLs", () => {
    cy.intercept("POST", `${API}/api/deep-scrape/start`, {
      statusCode: 201,
      body: {
        _id: "job4",
        name: "URL Scrape",
        status: "pending",
        direct_urls: ["https://instagram.com/reel/abc123"],
        stats: {},
        created_at: new Date().toISOString(),
      },
    }).as("startUrlScrape");

    cy.contains(/new|start|create/i).first().click();

    cy.get('[role="dialog"]').within(() => {
      cy.get("input").first().clear().type("URL Scrape");

      // Switch to direct URL mode
      cy.get("body").then(() => {
        // Look for the source toggle (URLs vs Seed Accounts)
        cy.root().then(($dialog) => {
          const hasToggle = $dialog.text().match(/url|direct/i);
          if (hasToggle) {
            cy.contains(/url|direct/i).click();
          }
        });
      });

      cy.get("textarea").first().clear().type("https://instagram.com/reel/abc123");
      cy.contains(/start|create|save/i).click();
    });

    cy.wait("@startUrlScrape");
  });

  it("pauses a running job", () => {
    cy.intercept("POST", `${API}/api/deep-scrape/job2/pause`, {
      statusCode: 200,
      body: { ...jobs[1], status: "paused" },
    }).as("pauseJob");

    // Find the running job row and click pause
    cy.contains("Yoga Scrape")
      .closest("tr, [data-testid], div[class*='card'], div[class*='row']")
      .within(() => {
        cy.get("button").then(($btns) => {
          const pauseBtn = $btns.filter(":contains('Pause'), [aria-label*='pause'], [title*='Pause']");
          if (pauseBtn.length) {
            pauseBtn.first().click();
          } else {
            // Try dropdown/menu
            $btns.last().click();
          }
        });
      });

    // If pause is in a dropdown menu
    cy.get("body").then(($body) => {
      if ($body.find('[role="menu"]').length) {
        cy.get('[role="menu"]').contains(/pause/i).click();
      }
    });

    cy.wait("@pauseJob");
  });

  it("cancels a running job", () => {
    cy.intercept("POST", `${API}/api/deep-scrape/job2/cancel`, {
      statusCode: 200,
      body: { ...jobs[1], status: "cancelled" },
    }).as("cancelJob");

    cy.contains("Yoga Scrape")
      .closest("tr, [data-testid], div[class*='card'], div[class*='row']")
      .within(() => {
        cy.get("button").last().click();
      });

    cy.get("body").then(($body) => {
      if ($body.find('[role="menu"]').length) {
        cy.get('[role="menu"]').contains(/cancel/i).click();
      }
    });

    // Confirm if dialog appears
    cy.get("body").then(($body) => {
      if ($body.find('[role="alertdialog"]').length) {
        cy.get('[role="alertdialog"]').contains(/cancel|confirm|yes/i).click();
      }
    });

    cy.wait("@cancelJob");
  });

  it("deletes a completed job", () => {
    cy.intercept("DELETE", `${API}/api/deep-scrape/job1`, {
      statusCode: 200,
      body: { deleted: true },
    }).as("deleteJob");

    cy.contains("Fitness Scrape")
      .closest("tr, [data-testid], div[class*='card'], div[class*='row']")
      .within(() => {
        cy.get("button").last().click();
      });

    cy.get("body").then(($body) => {
      if ($body.find('[role="menu"]').length) {
        cy.get('[role="menu"]').contains(/delete/i).click();
      }
    });

    // Confirm deletion
    cy.get("body").then(($body) => {
      if ($body.find('[role="alertdialog"]').length) {
        cy.get('[role="alertdialog"]').contains(/delete|confirm|yes/i).click();
      }
    });

    cy.wait("@deleteJob");
  });
});
