import { Card, CardContent } from "@/components/ui/card";
import { ResponseSpeedData } from "@/hooks/useOutboundAnalytics";
import { Clock, AlertTriangle, MessageCircle } from "lucide-react";

interface ResponseSpeedPanelProps {
  data: ResponseSpeedData;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = diff / 60000;
  if (mins < 60) return `${Math.round(mins)}m ago`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h ago`;
  return `${(mins / 1440).toFixed(1)}d ago`;
}

export function ResponseSpeedPanel({ data }: ResponseSpeedPanelProps) {
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-medium">Response Speed</h3>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Avg Prospect Reply</p>
            <p className="text-lg font-bold">{formatTime(data.avg_prospect_reply_time_min)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Your Response</p>
            <p className="text-lg font-bold">{formatTime(data.avg_user_response_time_min)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Median Your Response</p>
            <p className="text-lg font-bold">{formatTime(data.median_user_response_time_min)}</p>
          </div>
        </div>

        {/* Distribution buckets */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">Response Time Distribution</p>
          <div className="space-y-1.5">
            {data.distribution.map((bucket) => (
              <div key={bucket.bucket} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-16 shrink-0 text-right">
                  {bucket.bucket}
                </span>
                <div className="flex-1 bg-muted/30 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500/60 rounded-full transition-all flex items-center justify-end pr-1.5"
                    style={{ width: `${Math.max(bucket.percentage, 2)}%` }}
                  >
                    {bucket.percentage >= 10 && (
                      <span className="text-[9px] font-medium">{bucket.count}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground w-10 text-right">
                  {bucket.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Waiting stats */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Unanswered Replies</span>
            </div>
            <span className="text-sm font-bold">{data.unanswered_count}</span>
          </div>

          {data.oldest_waiting && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs text-muted-foreground">Oldest Waiting</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium">{data.oldest_waiting.lead_name}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">
                  {formatTimeSince(data.oldest_waiting.waiting_since)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Wait Time</span>
            <span className="text-sm font-medium">{formatTime(data.avg_waiting_time_min)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
