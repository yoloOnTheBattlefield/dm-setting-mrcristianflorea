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
import { sourceLabel } from "@/lib/agent";
import type { LeadSourceRow } from "@/hooks/useContentAnalytics";

interface LeadsBySourceProps {
  rows: LeadSourceRow[] | undefined;
  isLoading?: boolean;
  /** Show only the first N rows (dashboard). */
  limit?: number;
  /** Link to the full Content page. */
  showLink?: boolean;
}

export function LeadsBySource({ rows, isLoading, limit, showLink }: LeadsBySourceProps) {
  const all = (rows ?? []).filter((r) => r.leads > 0);
  const shown = limit ? all.slice(0, limit) : all;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base sm:text-lg">Leads by source</CardTitle>
        {showLink && (
          <Link to="/analytics/content" className="text-xs text-muted-foreground hover:text-foreground">
            Content
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Booked</TableHead>
                <TableHead className="text-right">Won</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={`${r.source_type}:${r.source_label ?? ""}`}>
                  <TableCell>{sourceLabel(r.source_type)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.source_label || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{(r.leads ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{(r.booked ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{(r.won ?? 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
