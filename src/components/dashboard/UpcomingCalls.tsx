import { Link } from "react-router-dom";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUpcomingCalls, bookingLeadId } from "@/hooks/useBookings";
import type { ApiBooking } from "@/lib/types";
import { formatCallTime } from "@/lib/formatters";

function callName(b: ApiBooking): string {
  const lead = b.lead;
  const full = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ");
  const handle = b.ig_username || lead?.ig_username;
  return b.contact_name || full || (handle ? `@${handle}` : b.email || "—");
}

export function UpcomingCalls() {
  const { data, isLoading, isError } = useUpcomingCalls(5);

  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardTitle className="text-base sm:text-lg">Upcoming calls</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load calls</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming calls</p>
        ) : (
          <ul className="divide-y">
            {data.map((b) => {
              const leadId = bookingLeadId(b);
              const name = callName(b);
              return (
                <li key={b._id} data-testid="upcoming-call" className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-36 shrink-0 tabular-nums text-muted-foreground">{formatCallTime(b.booking_date)}</span>
                  <span className="flex-1 truncate font-medium">
                    {leadId ? (
                      <Link to={`/lead/${leadId}`} className="hover:underline">
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </span>
                  {b.meeting_url && (
                    <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2">
                      <a href={b.meeting_url} target="_blank" rel="noreferrer" aria-label="Join">
                        <Video className="h-3.5 w-3.5" />
                        Join
                      </a>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
