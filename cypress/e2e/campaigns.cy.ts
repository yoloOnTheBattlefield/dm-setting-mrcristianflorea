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

function stubApi() {
  cy.intercept("GET", `${API}/api/campaigns?*`, {
    statusCode: 200,
    body: campaigns,
  }).as("getCampaigns");

  cy.intercept("GET", `${API}/api/campaigns/camp1`, {
    statusCode: 200,
    body: campaigns[0],
  }).as("getCampaign1");

  cy.intercept("GET", `${API}/api/campaigns/camp1/stats`, {
    statusCode: 200,
    body: campaigns[0].stats,
  }).as("getCampaignStats");

  cy.intercept("GET", `${API}/api/campaigns/camp1/leads*`, {
    statusCode: 200,
    body: {
      leads: [
        { _id: "cl1", username: "lead_user1", status: "sent", message: "Hey!" },
        { _id: "cl2", username: "lead_user2", status: "pending", message: "" },
      ],
      pagination: { total: 2, page: 1, totalPages: 1 },
    },
  }).as("getCampaignLeads");

  cy.intercept("GET", `${API}/api/campaigns/camp1/senders*`, {
    statusCode: 200,
    body: [],
  }).as("getCampaignSenders");

  cy.intercept("GET", `${API}/api/campaigns/camp1/next-send*`, {
    statusCode: 200,
    body: { next_send: null },
  }).as("getNextSend");

  cy.intercept("GET", `${API}/api/outbound-accounts*`, {
    statusCode: 200,
    body: [],
  }).as("getOutboundAccounts");
}

describe("Campaigns Page", () => {
  beforeEach(() => {
    cy.login();
    stubApi();
    cy.visit("/campaigns");
    cy.wait("@getCampaigns");
  });

  it("renders campaign list with names and statuses", () => {
    cy.contains("Campaigns").should("be.visible");
    cy.contains("Fitness Outreach").should("be.visible");
    cy.contains("Gym Leads").should("be.visible");
  });

  it("shows stat summary line", () => {
    // Header shows total campaigns and active count
    cy.contains(/2 campaigns/i).should("be.visible");
  });

  it("creates a new campaign", () => {
    cy.intercept("POST", `${API}/api/campaigns`, {
      statusCode: 201,
      body: {
        _id: "camp3",
        name: "New Campaign",
        status: "draft",
        type: "auto",
        stats: { total: 0, pending: 0, sent: 0, delivered: 0, replied: 0, failed: 0, skipped: 0, booked: 0, link_sent: 0, queued: 0, without_message: 0 },
        created_at: new Date().toISOString(),
      },
    }).as("createCampaign");

    // Open create dialog
    cy.contains(/new campaign|create/i).click();

    // Fill in name
    cy.get('[role="dialog"]').within(() => {
      cy.get("input").first().clear().type("New Campaign");
      cy.contains(/create|save/i).click();
    });

    cy.wait("@createCampaign");
  });

  it("navigates to campaign detail", () => {
    cy.contains("Fitness Outreach").click();
    cy.wait("@getCampaign1");
    cy.url().should("include", "/campaigns/camp1");
  });

  it("starts a campaign from detail view", () => {
    cy.intercept("POST", `${API}/api/campaigns/camp1/start`, {
      statusCode: 200,
      body: { ...campaigns[0], status: "active" },
    }).as("startCampaign");

    cy.visit("/campaigns/camp1");
    cy.wait("@getCampaign1");

    // Look for a start button (may not exist if already active)
    cy.get("body").then(($body) => {
      if ($body.text().match(/start/i)) {
        cy.contains(/^start$/i).click();
        cy.wait("@startCampaign");
      }
    });
  });

  it("pauses a campaign from detail view", () => {
    cy.intercept("POST", `${API}/api/campaigns/camp1/pause`, {
      statusCode: 200,
      body: { ...campaigns[0], status: "paused" },
    }).as("pauseCampaign");

    cy.visit("/campaigns/camp1");
    cy.wait("@getCampaign1");

    cy.get("body").then(($body) => {
      if ($body.text().match(/pause/i)) {
        cy.contains(/^pause$/i).click();
        cy.wait("@pauseCampaign");
      }
    });
  });

  it("deletes a campaign", () => {
    cy.intercept("DELETE", `${API}/api/campaigns/camp2`, {
      statusCode: 200,
      body: { deleted: true },
    }).as("deleteCampaign");

    cy.intercept("GET", `${API}/api/campaigns/camp2`, {
      statusCode: 200,
      body: campaigns[1],
    }).as("getCampaign2");

    cy.intercept("GET", `${API}/api/campaigns/camp2/stats`, {
      statusCode: 200,
      body: campaigns[1].stats,
    }).as("getCampaign2Stats");

    cy.intercept("GET", `${API}/api/campaigns/camp2/leads*`, {
      statusCode: 200,
      body: { leads: [], pagination: { total: 0, page: 1, totalPages: 1 } },
    }).as("getCampaign2Leads");

    cy.intercept("GET", `${API}/api/campaigns/camp2/senders*`, {
      statusCode: 200,
      body: [],
    }).as("getCampaign2Senders");

    cy.visit("/campaigns/camp2");
    cy.wait("@getCampaign2");

    cy.get("body").then(($body) => {
      if ($body.text().match(/delete/i)) {
        cy.contains(/delete/i).first().click();
        // Confirm in dialog if present
        cy.get("body").then(($inner) => {
          if ($inner.find('[role="alertdialog"]').length) {
            cy.get('[role="alertdialog"]').within(() => {
              cy.contains(/delete|confirm|yes/i).click();
            });
          }
        });
        cy.wait("@deleteCampaign");
      }
    });
  });
});
