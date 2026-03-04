import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import type {
  FollowerTierData,
  PromptLabelData,
  QuestionTypeData,
} from "@/hooks/useOutboundAnalytics";
import { cn } from "@/lib/utils";

function rateColor(rate: number): string {
  if (rate >= 10) return "text-[#22C55E]";
  if (rate >= 5) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function fmtRate(v: number): string {
  return `${v.toFixed(1)}%`;
}

const TIER_ORDER = ["<1K", "1K-10K", "10K-100K", "100K+"];

interface InsightsTabProps {
  tiers: FollowerTierData[];
  labels: PromptLabelData[];
  questionTypes: QuestionTypeData[];
  isLoading: boolean;
}

export function InsightsTab({ tiers, labels, questionTypes, isLoading }: InsightsTabProps) {
  if (isLoading) return <DashboardSkeleton />;

  const sortedTiers = [...tiers].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4 px-6">
          <h3 className="text-sm font-medium mb-4">Reply Rate by Follower Tier</h3>
          <BreakdownTable
            rows={sortedTiers.map((t) => ({ name: t.tier, ...t }))}
            emptyText="No follower tier data available."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-6">
          <h3 className="text-sm font-medium mb-4">Reply Rate by Industry</h3>
          <BreakdownTable
            rows={labels.map((l) => ({ name: l.label, ...l }))}
            emptyText="No industry data available."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-6">
          <h3 className="text-sm font-medium mb-4">Reply Rate by Question Type</h3>
          <BreakdownTable
            rows={questionTypes.map((q) => ({ name: q.type, ...q }))}
            emptyText="No question type data available. Message storage must be enabled for this analysis."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownTable({
  rows,
  emptyText,
}: {
  rows: { name: string; sent: number; replied: number; booked: number; reply_rate: number; book_rate: number }[];
  emptyText: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Segment</TableHead>
          <TableHead className="text-right">Sent</TableHead>
          <TableHead className="text-right">Replied</TableHead>
          <TableHead className="text-right">Reply Rate</TableHead>
          <TableHead className="text-right">Booked</TableHead>
          <TableHead className="text-right">Book Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-right">{r.sent}</TableCell>
              <TableCell className="text-right">{r.replied}</TableCell>
              <TableCell className={cn("text-right font-medium", rateColor(r.reply_rate))}>
                {fmtRate(r.reply_rate)}
              </TableCell>
              <TableCell className={cn("text-right", r.booked === 0 && "text-[#A0AEC0]")}>
                {r.booked}
              </TableCell>
              <TableCell className={cn("text-right font-medium", rateColor(r.book_rate))}>
                {fmtRate(r.book_rate)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
