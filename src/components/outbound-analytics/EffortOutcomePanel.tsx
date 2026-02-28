import { Card, CardContent } from "@/components/ui/card";
import { EffortOutcomeData } from "@/hooks/useOutboundAnalytics";
import { Target } from "lucide-react";

interface EffortOutcomePanelProps {
  data: EffortOutcomeData;
}

function formatRatio(v: number): string {
  if (!isFinite(v) || isNaN(v)) return "-";
  return v.toFixed(1);
}

function efficiencyColor(v: number, thresholds: [number, number]): string {
  if (!isFinite(v) || isNaN(v)) return "text-muted-foreground";
  if (v <= thresholds[0]) return "text-green-400";
  if (v <= thresholds[1]) return "text-yellow-400";
  return "text-red-400";
}

export function EffortOutcomePanel({ data }: EffortOutcomePanelProps) {
  const metrics = [
    {
      label: "Messages per Reply",
      value: data.messages_per_reply,
      thresholds: [5, 15] as [number, number],
      description: "How many messages to get one reply",
    },
    {
      label: "Messages per Link Sent",
      value: data.messages_per_link_sent,
      thresholds: [10, 25] as [number, number],
      description: "How many messages to send one link",
    },
    {
      label: "Messages per Booking",
      value: data.messages_per_booking,
      thresholds: [20, 50] as [number, number],
      description: "How many messages to get one booking",
    },
    {
      label: "Replies per Booking",
      value: data.replies_per_booking,
      thresholds: [3, 8] as [number, number],
      description: "How many replies to get one booking",
    },
  ];

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium">Effort vs Outcome</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-xl font-bold ${efficiencyColor(m.value, m.thresholds)}`}>
                {formatRatio(m.value)}
              </p>
              <p className="text-[10px] text-muted-foreground">{m.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
