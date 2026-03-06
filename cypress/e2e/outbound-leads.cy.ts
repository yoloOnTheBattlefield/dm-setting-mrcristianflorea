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

function stubApi() {
  cy.intercept("GET", `${API}/outbound-leads?*`, {
    statusCode: 200,
    body: { leads, pagination: { total: 2, page: 1, totalPages: 1, limit: 20 } },
  }).as("getLeads");

  cy.intercept("GET", `${API}/outbound-leads/stats*`, {
    statusCode: 200,
    body: stats,
  }).as("getStats");

  cy.intercept("GET", `${API}/outbound-leads/sources*`, {
    statusCode: 200,
    body: sources,
  }).as("getSources");
}

describe("Outbound Leads Page", () => {
  beforeEach(() => {
    cy.login();
    stubApi();
    cy.visit("/outbound-leads");
    cy.wait(["@getLeads", "@getStats"]);
  });

  it("renders the page header and leads table", () => {
    cy.contains("Outbound Leads").should("be.visible");
    cy.contains("johndoe").should("be.visible");
    cy.contains("janefitness").should("be.visible");
  });

  it("displays funnel stats", () => {
    cy.contains("2").should("be.visible"); // total
  });

  it("searches leads by username", () => {
    const filtered = [leads[0]];
    cy.intercept("GET", `${API}/outbound-leads?*search=john*`, {
      statusCode: 200,
      body: { leads: filtered, pagination: { total: 1, page: 1, totalPages: 1, limit: 20 } },
    }).as("searchLeads");

    cy.get('input[placeholder*="Search"]').first().type("john");
    cy.wait("@searchLeads");
    cy.contains("johndoe").should("be.visible");
    cy.contains("janefitness").should("not.exist");
  });

  it("paginates when there are multiple pages", () => {
    cy.intercept("GET", `${API}/outbound-leads?*`, {
      statusCode: 200,
      body: { leads, pagination: { total: 40, page: 1, totalPages: 2, limit: 20 } },
    }).as("getPage1");

    cy.visit("/outbound-leads");
    cy.wait("@getPage1");

    cy.intercept("GET", `${API}/outbound-leads?*page=2*`, {
      statusCode: 200,
      body: { leads: [leads[0]], pagination: { total: 40, page: 2, totalPages: 2, limit: 20 } },
    }).as("getPage2");

    cy.contains("Next").click();
    cy.wait("@getPage2");
  });

  it("bulk deletes selected leads", () => {
    cy.intercept("POST", `${API}/outbound-leads/bulk-delete`, {
      statusCode: 200,
      body: { deletedCount: 1 },
    }).as("bulkDelete");

    // Select the first lead checkbox
    cy.get('table tbody tr').first().find('input[type="checkbox"], button[role="checkbox"]').first().click();

    // Click the delete button
    cy.contains(/delete/i).click();

    // Confirm deletion in the dialog
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains(/delete|confirm|yes/i).click();
    });

    cy.wait("@bulkDelete");
  });

  it("updates a lead as messaged", () => {
    cy.intercept("PATCH", `${API}/outbound-leads/lead1`, {
      statusCode: 200,
      body: { ...leads[0], isMessaged: true },
    }).as("updateLead");

    // Click the messaged checkbox for the first lead
    cy.get("table tbody tr")
      .first()
      .find('input[type="checkbox"], button[role="checkbox"]')
      .eq(1) // second checkbox (first is row-select)
      .click();

    cy.wait("@updateLead");
  });
});
