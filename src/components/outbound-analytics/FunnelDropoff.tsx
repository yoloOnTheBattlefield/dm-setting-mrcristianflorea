import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { OutboundFunnelData } from "@/hooks/useOutboundAnalytics";

interface FunnelDropoffProps {
  data: OutboundFunnelData;
}

interface FunnelStage {
  label: string;
  value: number;
  dropPct: number;
  dropAbs: number;
  isLargestDrop: boolean;
}

export function FunnelDropoff({ data }: FunnelDropoffProps) {
  const stages = useMemo(() => {
    const raw = [
      { label: "Messaged", value: data.messaged ?? 0 },
      { label: "Replied", value: data.replied ?? 0 },
      { label: "Converted", value: data.booked ?? 0 },
      { label: "Closed", value: data.contracts ?? 0 },
    ];

    // Calculate drops
    let largestDropIdx = -1;
    let largestDropPct = 0;

    const result: FunnelStage[] = raw.map((stage, i) => {
      if (i === 0) {
        return { ...stage, dropPct: 0, dropAbs: 0, isLargestDrop: false };
      }
      const prev = raw[i - 1].value;
      const drop = prev > 0 ? ((prev - stage.value) / prev) * 100 : 0;
      const dropAbs = prev - stage.value;
      if (drop > largestDropPct && prev > 0) {
        largestDropPct = drop;
        largestDropIdx = i;
      }
      return { ...stage, dropPct: drop, dropAbs, isLargestDrop: false };
    });

    if (largestDropIdx >= 0) {
      result[largestDropIdx].isLargestDrop = true;
    }

    return result;
  }, [data]);

  const maxValue = stages[0]?.value || 1;

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <h3 className="text-sm font-medium mb-4">Funnel Drop-Off</h3>

        <div className="space-y-1">
          {stages.map((stage, i) => {
            const width = maxValue > 0 ? Math.max((stage.value / maxValue) * 100, 4) : 4;

            return (
              <div key={stage.label}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">
                    {stage.label}
                  </span>
                  <div className="flex-1 relative">
                    <div
                      className="h-8 rounded-md flex items-center px-3 transition-all"
                      style={{
                        width: `${width}%`,
                        backgroundColor: stage.isLargestDrop
                          ? "hsl(0 70% 55% / 0.3)"
                          : `hsl(220 70% 55% / ${0.2 + (1 - i / stages.length) * 0.5})`,
                        borderLeft: stage.isLargestDrop
                          ? "3px solid hsl(0 70% 55%)"
                          : "3px solid hsl(220 70% 55%)",
                      }}
                    >
                      <span className="text-xs font-medium">{stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Drop indicator between stages */}
                {i > 0 && i < stages.length && stage.dropPct > 0 && (
                  <div className="flex items-center gap-3 my-0.5">
                    <span className="w-16 shrink-0" />
                    <span
                      className={`text-[10px] font-medium ${
                        stage.isLargestDrop ? "text-red-400" : "text-muted-foreground"
                      }`}
                    >
                      -{stage.dropPct.toFixed(1)}% ({stage.dropAbs.toLocaleString()} lost)
                      {stage.isLargestDrop && " — largest drop"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
