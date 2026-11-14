import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeadMagnetQueue } from "./LeadMagnetQueue";
import { useLeadMagnetQueue, useUpdateAgentContact } from "@/hooks/useAgent";

vi.mock("@/hooks/useAgent", () => ({
  useLeadMagnetQueue: vi.fn(),
  useUpdateAgentContact: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const mockQueue = vi.mocked(useLeadMagnetQueue);
const mockUpdate = vi.mocked(useUpdateAgentContact);
const mutate = vi.fn();

function setContacts(contacts: unknown[]) {
  mockQueue.mockReturnValue({
    data: { contacts },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeadMagnetQueue>);
}

function renderCard() {
  return render(
    <MemoryRouter>
      <LeadMagnetQueue />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mutate.mockReset();
  mockUpdate.mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useUpdateAgentContact>);
});

describe("LeadMagnetQueue", () => {
  it("lists leads needing a magnet and saves the doc link through the agent API", () => {
    setContacts([
      {
        _id: "l1",
        first_name: "Ana",
        last_name: "",
        ig_username: "ana_mna",
        ig_user_id: "1456",
        lead_magnet: { status: "posted", brief: "M&A advisor, France, 5-10% fee" },
      },
    ]);
    renderCard();
    expect(screen.getByText("@ana_mna")).toBeInTheDocument();
    expect(screen.getByText("M&A advisor, France, 5-10% fee")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Doc link"), { target: { value: "https://docs.google.com/x" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      ref: "1456",
      patch: {
        lead_magnet: {
          status: "posted",
          brief: "M&A advisor, France, 5-10% fee",
          doc_url: "https://docs.google.com/x",
        },
      },
    });
  });

  it("shows the empty line when nothing needs building", () => {
    setContacts([]);
    renderCard();
    expect(screen.getByText("Nothing to build")).toBeInTheDocument();
  });
});
