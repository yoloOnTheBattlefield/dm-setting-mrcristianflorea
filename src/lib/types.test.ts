import { describe, it, expect } from "vitest";
import { transformApiLead, type ApiLead } from "./types";

describe("transformApiLead", () => {
  const baseLead: ApiLead = {
    _id: "abc123",
    account_id: "acc1",
    contact_id: "c1",
    first_name: "John",
    last_name: "Doe",
    date_created: "2025-01-15T10:00:00Z",
    qualified_at: null,
    link_sent_at: null,
    booked_at: null,
    ghosted_at: null,
    follow_up_at: null,
  };

  it("maps fields correctly", () => {
    const contact = transformApiLead(baseLead);
    expect(contact.contactId).toBe("c1");
    expect(contact.name).toBe("John Doe");
    expect(contact.dateCreated).toBe("2025-01-15T10:00:00Z");
    expect(contact.bookedDate).toBeNull();
    expect(contact.ghostedDate).toBeNull();
    expect(contact.fupDate).toBeNull();
  });

  it("trims outer whitespace from name", () => {
    const contact = transformApiLead({ ...baseLead, first_name: "  Jane", last_name: "Smith  " });
    expect(contact.name).toBe("Jane Smith");
  });

  it("handles missing last name", () => {
    const contact = transformApiLead({ ...baseLead, last_name: "" });
    expect(contact.name).toBe("John");
  });

  it("handles missing first name", () => {
    const contact = transformApiLead({ ...baseLead, first_name: "", last_name: "Doe" });
    expect(contact.name).toBe("Doe");
  });

  it("maps date fields when present", () => {
    const contact = transformApiLead({
      ...baseLead,
      booked_at: "2025-02-01T12:00:00Z",
      ghosted_at: "2025-02-02T12:00:00Z",
      follow_up_at: "2025-02-03T12:00:00Z",
    });
    expect(contact.bookedDate).toBe("2025-02-01T12:00:00Z");
    expect(contact.ghostedDate).toBe("2025-02-02T12:00:00Z");
    expect(contact.fupDate).toBe("2025-02-03T12:00:00Z");
  });
});
