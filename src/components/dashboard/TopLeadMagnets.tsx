import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLeadMagnetStats } from "@/hooks/useCommentRules";

interface TopLeadMagnetsProps {
  days: number;
}

export function TopLeadMagnets({ days }: TopLeadMagnetsProps) {
  const { data, isLoading, isError } = useLeadMagnetStats(days);
  const rules = (data?.rules ?? []).filter((r) => r.requests > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base sm:text-lg">Top Lead Magnets</CardTitle>
        <Link
          to="/settings/comment-automation"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Comment Automation
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load lead magnets</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead magnet</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">DMs sent</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Booked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r, i) => (
                <TableRow key={r.rule_id} className={cn(i === 0 && "bg-primary/5 font-medium")}>
                  <TableCell>{r.name || r.keywords[0] || "Untitled"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.keywords.join(", ")}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.sent.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.leads.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.booked.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
