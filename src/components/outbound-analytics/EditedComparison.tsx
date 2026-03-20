import { Card, CardContent } from "@/components/ui/card";
import { EditedComparisonData } from "@/hooks/useOutboundAnalytics";
import { formatDuration } from "@/lib/formatters";
import { Pencil, Sparkles } from "lucide-react";

interface EditedComparisonProps {
  data: EditedComparisonData;
}

function rateColor(rate: number): string {
  if (rate >= 10) return "text-green-400";
  if (rate >= 5) return "text-yellow-400";
  return "text-red-400";
}

function diffIndicator(edited: number, ai: number): string {
  if (ai === 0) return "";
  const diff = ((edited - ai) / ai) * 100;
  if (Math.abs(diff) < 0.5) return "";
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
}

function diffColor(edited: number, ai: number): string {
  if (edited > ai) return "text-green-400";
  if (edited < ai) return "text-red-400";
  return "text-muted-foreground";
}

interface MetricRowProps {
  label: string;
  aiValue: string;
  editedValue: string;
  aiRaw: number;
  editedRaw: number;
  isRate?: boolean;
}

function MetricRow({ label, aiValue, editedValue, aiRaw, editedRaw, isRate }: MetricRowProps) {
  const diff = diffIndicator(editedRaw, aiRaw);
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-6">
        <span className={`text-xs font-medium w-14 text-right ${isRate ? rateColor(aiRaw) : ""}`}>
          {aiValue}
        </span>
        <span className={`text-xs font-medium w-14 text-right ${isRate ? rateColor(editedRaw) : ""}`}>
          {editedValue}
        </span>
        {diff && (
          <span className={`text-[10px] w-14 text-right ${diffColor(editedRaw, aiRaw)}`}>
            {diff}
          </span>
        )}
        {!diff && <span className="w-14" />}
      </div>
    </div>
  );
}

export function EditedComparison({ data }: EditedComparisonProps) {
  const ai = data.ai_generated;
  const ed = data.edited;

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <h3 className="text-sm font-medium mb-4">AI Generated vs Edited</h3>

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Metric</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 w-14 justify-end">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-muted-foreground">AI</span>
            </div>
            <div className="flex items-center gap-1.5 w-14 justify-end">
              <Pencil className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] text-muted-foreground">Edited</span>
            </div>
            <span className="text-[10px] text-muted-foreground w-14 text-right">Diff</span>
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-xs text-muted-foreground">Messages</span>
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium w-14 text-right">{ai.count.toLocaleString()}</span>
            <span className="text-xs font-medium w-14 text-right">{ed.count.toLocaleString()}</span>
            <span className="w-14" />
          </div>
        </div>

        <MetricRow
          label="Reply Rate"
          aiValue={`${ai.reply_rate.toFixed(1)}%`}
          editedValue={`${ed.reply_rate.toFixed(1)}%`}
          aiRaw={ai.reply_rate}
          editedRaw={ed.reply_rate}
          isRate
        />
        <MetricRow
          label="Link Sent Rate"
          aiValue={`${ai.link_sent_rate.toFixed(1)}%`}
          editedValue={`${ed.link_sent_rate.toFixed(1)}%`}
          aiRaw={ai.link_sent_rate}
          editedRaw={ed.link_sent_rate}
          isRate
        />
        <MetricRow
          label="Booked Rate"
          aiValue={`${ai.booked_rate.toFixed(1)}%`}
          editedValue={`${ed.booked_rate.toFixed(1)}%`}
          aiRaw={ai.booked_rate}
          editedRaw={ed.booked_rate}
          isRate
        />
        <MetricRow
          label="Avg Response Time"
          aiValue={formatDuration(ai.avg_response_time_min)}
          editedValue={formatDuration(ed.avg_response_time_min)}
          aiRaw={ed.avg_response_time_min}
          editedRaw={ai.avg_response_time_min}
        />
      </CardContent>
    </Card>
  );
}
