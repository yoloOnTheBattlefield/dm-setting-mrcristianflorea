import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ActionItemList from "./ActionItemList";
import type { ActionItem } from "@/lib/advisory-types";

const mockItems: ActionItem[] = [
  {
    _id: "1",
    task: "Follow up with client",
    owner: "Alice",
    due_date: "2025-01-01",
    completed: false,
  },
  {
    _id: "2",
    task: "Send proposal",
    owner: "Bob",
    due_date: undefined,
    completed: true,
  },
];

describe("ActionItemList", () => {
  it("renders empty state when no items", () => {
    render(<ActionItemList items={[]} />);
    expect(screen.getByText("No action items")).toBeInTheDocument();
  });

  it("renders action item tasks", () => {
    render(<ActionItemList items={mockItems} />);
    expect(screen.getByText("Follow up with client")).toBeInTheDocument();
    expect(screen.getByText("Send proposal")).toBeInTheDocument();
  });

  it("renders owner names", () => {
    render(<ActionItemList items={mockItems} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("applies line-through class to completed items", () => {
    const { container } = render(<ActionItemList items={mockItems} />);
    const completedSpan = screen.getByText("Send proposal");
    expect(completedSpan.className).toContain("line-through");
  });

  it("does not apply line-through class to incomplete items", () => {
    render(<ActionItemList items={mockItems} />);
    const incompleteSpan = screen.getByText("Follow up with client");
    expect(incompleteSpan.className).not.toContain("line-through");
  });

  it("shows overdue styling for past due dates on incomplete items", () => {
    const overdueItems: ActionItem[] = [
      {
        _id: "3",
        task: "Overdue task",
        owner: "Charlie",
        due_date: "2020-01-01",
        completed: false,
      },
    ];
    const { container } = render(<ActionItemList items={overdueItems} />);
    const dueSpan = container.querySelector(".text-red-400");
    expect(dueSpan).toBeInTheDocument();
  });
});
