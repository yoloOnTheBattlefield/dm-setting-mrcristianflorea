import { StageAging } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StageAgingTableProps {
  data: StageAging[];
}

function getDaysSeverity(days: number): string {
  if (days <= 2) return "text-muted-foreground";
  if (days <= 4) return "text-stage-link-sent";
  if (days <= 7) return "text-stage-ghosted/80";
  return "text-stage-ghosted";
}

function getDaysBg(days: number): string {
  if (days <= 2) return "bg-muted/50";
  if (days <= 4) return "bg-stage-link-sent/10";
  if (days <= 7) return "bg-stage-ghosted/10";
  return "bg-stage-ghosted/20";
}

export function StageAgingTable({ data }: StageAgingTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Stage Aging & Backlog</h2>
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No stuck leads detected
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Stage Aging & Backlog</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Leads stuck in stages (days since last action)
      </p>

      <div className="space-y-4">
        {data.map((stage) => (
          <div key={stage.stage}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{stage.stage}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {stage.count} stuck
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stage.contacts.map((contact, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs",
                    getDaysBg(contact.daysSinceAction)
                  )}
                >
                  <span className="font-medium">{contact.name.split(" ")[0]}</span>
                  <span className={cn("ml-1", getDaysSeverity(contact.daysSinceAction))}>
                    {contact.daysSinceAction}d
                  </span>
                </div>
              ))}
              {stage.count > 10 && (
                <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  +{stage.count - 10} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
