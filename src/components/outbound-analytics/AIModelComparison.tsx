import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AIModelPerformance } from "@/hooks/useOutboundAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { formatDuration } from "@/lib/formatters";

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

/** Nice display name for the raw model ID */
function modelDisplayName(model: string): string {
  const names: Record<string, string> = {
    "o4-mini": "GPT o4-mini",
    "claude-sonnet-4-20250514": "Claude Sonnet 4",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    // Legacy fallback — old records that only had provider stored
    openai: "GPT o4-mini",
    claude: "Claude Sonnet 4",
    gemini: "Gemini 2.0 Flash",
  };
  return names[model] || model;
}

function providerBadgeColor(provider: string): string {
  switch (provider) {
    case "openai":
      return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    case "claude":
      return "bg-orange-600/20 text-orange-400 border-orange-600/30";
    case "gemini":
      return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    default:
      return "";
  }
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
            <TableHead className="text-right">Booked Rate</TableHead>
            <TableHead className="text-right">Avg Response Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No AI model data available.
              </TableCell>
            </TableRow>
          ) : (
            data.map((m) => (
              <TableRow key={m.model}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{modelDisplayName(m.model)}</span>
                    <Badge variant="outline" className={`text-[10px] ${providerBadgeColor(m.provider)}`}>
                      {m.provider}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">{m.messages_sent.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium ${rateColor(m.reply_rate)}`}>
                  {fmtRate(m.reply_rate)}
                </TableCell>
                <TableCell className={`text-right font-medium ${rateColor(m.booked_rate)}`}>
                  {fmtRate(m.booked_rate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDuration(m.avg_response_time_min)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
