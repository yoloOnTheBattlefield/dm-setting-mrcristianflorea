import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreTierData } from "@/hooks/useOutboundAnalytics";

function rateColor(rate: number): string {
  if (rate >= 10) return "text-[#22C55E]";
  if (rate >= 5) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function fmtRate(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtCurrency(v: number): string {
  return v > 0 ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "\u2014";
}

interface ScoreBreakdownProps {
  tiers: ScoreTierData[];
  isLoading: boolean;
}

export function ScoreBreakdown({ tiers, isLoading }: ScoreBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 px-6">
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...tiers].sort((a, b) => a.stars - b.stars);

  return (
    <Card>
      <CardContent className="py-4 px-6">
        <h3 className="text-sm font-medium mb-4">Performance by Lead Score</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Replied</TableHead>
              <TableHead className="text-right">Reply Rate</TableHead>
              <TableHead className="text-right">Booked</TableHead>
              <TableHead className="text-right">Book Rate</TableHead>
              <TableHead className="text-right">Close Rate</TableHead>
              <TableHead className="text-right">Avg Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No scored leads available. Add scores to outbound leads to see performance breakdowns.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                      {Array.from({ length: 5 - t.stars }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{t.sent}</TableCell>
                  <TableCell className="text-right">{t.replied}</TableCell>
                  <TableCell className={cn("text-right font-medium", rateColor(t.reply_rate))}>
                    {fmtRate(t.reply_rate)}
                  </TableCell>
                  <TableCell className={cn("text-right", t.booked === 0 && "text-[#A0AEC0]")}>
                    {t.booked}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", rateColor(t.book_rate))}>
                    {fmtRate(t.book_rate)}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", rateColor(t.close_rate))}>
                    {fmtRate(t.close_rate)}
                  </TableCell>
                  <TableCell className="text-right">{fmtCurrency(t.avg_revenue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
