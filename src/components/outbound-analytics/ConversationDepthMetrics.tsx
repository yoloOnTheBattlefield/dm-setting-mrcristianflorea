import { Card, CardContent } from "@/components/ui/card";
import { ConversationDepthData } from "@/hooks/useOutboundAnalytics";
import { MessagesSquare } from "lucide-react";

interface ConversationDepthMetricsProps {
  data: ConversationDepthData;
}

function rateColor(rate: number): string {
  if (rate >= 10) return "text-green-400";
  if (rate >= 5) return "text-yellow-400";
  return "text-red-400";
}

export function ConversationDepthMetrics({ data }: ConversationDepthMetricsProps) {
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-2 mb-4">
          <MessagesSquare className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium">Conversation Depth</h3>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Avg Messages / Conv</p>
            <p className="text-lg font-bold">{data.avg_messages_per_conversation.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">3+ Messages</p>
            <p className="text-lg font-bold">{data.pct_3_plus_messages.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">5+ Messages</p>
            <p className="text-lg font-bold">{data.pct_5_plus_messages.toFixed(1)}%</p>
          </div>
        </div>

        {/* Booking rate by depth */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Booking Rate by Conversation Depth</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">Depth</th>
                  <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Conversations</th>
                  <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Booked</th>
                  <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.booking_rate_by_depth.map((row) => (
                  <tr key={row.depth} className="border-b last:border-0">
                    <td className="py-1.5 px-3 font-medium">{row.depth}</td>
                    <td className="text-right py-1.5 px-3">{row.conversations}</td>
                    <td className="text-right py-1.5 px-3">{row.booked}</td>
                    <td className={`text-right py-1.5 px-3 font-medium ${rateColor(row.booking_rate)}`}>
                      {row.booking_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
