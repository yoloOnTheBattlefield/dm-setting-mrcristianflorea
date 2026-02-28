import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AIModelPerformance } from "@/hooks/useOutboundAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

interface AIModelComparisonProps {
  data: AIModelPerformance[];
  isLoading: boolean;
}

function rateColor(rate: number): string {
  if (rate >= 10) return "text-green-400";
  if (rate >= 5) return "text-yellow-400";
  return "text-red-400";
}

function fmtRate(v: number): string {
  return `${v.toFixed(1)}%`;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function modelDisplayName(model: string): string {
  const names: Record<string, string> = {
    "gpt-4": "GPT-4",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-sonnet": "Claude Sonnet",
    "claude-haiku": "Claude Haiku",
    "claude-opus": "Claude Opus",
    "gemini-pro": "Gemini Pro",
    "gemini-flash": "Gemini Flash",
  };
  return names[model] || model;
}

export function AIModelComparison({ data, isLoading }: AIModelComparisonProps) {
  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Messages Sent</TableHead>
            <TableHead className="text-right">Reply Rate</TableHead>
            <TableHead className="text-right">Link Sent Rate</TableHead>
            <TableHead className="text-right">Booked Rate</TableHead>
            <TableHead className="text-right">Avg Response Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No AI model data available.
              </TableCell>
            </TableRow>
          ) : (
            data.map((m) => (
              <TableRow key={m.model}>
                <TableCell className="font-medium">{modelDisplayName(m.model)}</TableCell>
                <TableCell className="text-right">{m.messages_sent.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium ${rateColor(m.reply_rate)}`}>
                  {fmtRate(m.reply_rate)}
                </TableCell>
                <TableCell className={`text-right font-medium ${rateColor(m.link_sent_rate)}`}>
                  {fmtRate(m.link_sent_rate)}
                </TableCell>
                <TableCell className={`text-right font-medium ${rateColor(m.booked_rate)}`}>
                  {fmtRate(m.booked_rate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatTime(m.avg_response_time_min)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
