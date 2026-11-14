import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadBookings } from "@/hooks/useBookings";
import { formatCallTime } from "@/lib/formatters";
import type { ApiLead, BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<BookingStatus, string> = {
  scheduled: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  completed: "bg-green-500/15 text-green-500 border-green-500/30",
  no_show: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  cancelled: "bg-muted text-muted-foreground",
};

export function LeadCalls({ lead }: { lead: ApiLead }) {
  const { data: bookings = [], isLoading } = useLeadBookings(lead._id);
  const now = Date.now();
  const upcoming = bookings
    .filter((b) => b.status === "scheduled" && new Date(b.booking_date).getTime() >= now)
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())[0];
  const next = lead.next_booking ??
    (upcoming ? { start: upcoming.booking_date, status: upcoming.status, meeting_url: upcoming.meeting_url } : null);
  const history = [...bookings].sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
  );

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {isLoading && !next ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 text-sm" data-testid="next-call">
              <span className="text-muted-foreground">Next call</span>
              {next ? (
                <span className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{formatCallTime(next.start)}</span>
                  {next.meeting_url && (
                    <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2">
                      <a href={next.meeting_url} target="_blank" rel="noreferrer">
                        <Video className="h-3.5 w-3.5" />
                        Join
                      </a>
                    </Button>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            {history.length > 0 && (
              <ul className="space-y-1.5">
                {history.map((b) => (
                  <li key={b._id} data-testid="call-history-row" className="flex items-center justify-between text-sm">
                    <span className="tabular-nums">{formatCallTime(b.booking_date)}</span>
                    <Badge variant="outline" className={cn("text-xs", STATUS_CLASSES[b.status])}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
