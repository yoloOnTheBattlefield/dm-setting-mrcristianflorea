import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { TimeOfDayData } from "@/hooks/useOutboundAnalytics";

interface TimeOfDayHeatmapProps {
  data: TimeOfDayData[];
}

function getReplyRateColor(rate: number, max: number): string {
  if (max === 0 || rate === 0) return "bg-muted/30";
  const ratio = rate / max;
  if (ratio <= 0.25) return "bg-blue-900/40";
  if (ratio <= 0.5) return "bg-blue-700/50";
  if (ratio <= 0.75) return "bg-blue-500/70";
  return "bg-blue-400";
}

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return "12p";
  return `${hour - 12}p`;
}

function formatHourFull(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

export function TimeOfDayHeatmap({ data }: TimeOfDayHeatmapProps) {
  const { hours, maxRate, bestHour, bestHourData } = useMemo(() => {
    // Fill all 24 hours
    const allHours: TimeOfDayData[] = Array.from({ length: 24 }, (_, i) => {
      const existing = data.find((d) => d.hour === i);
      return existing || { hour: i, sent: 0, replied: 0, reply_rate: 0 };
    });

    let max = 0;
    let best = -1;
    let bestData: TimeOfDayData | null = null;
    allHours.forEach((h) => {
      if (h.reply_rate > max) {
        max = h.reply_rate;
        best = h.hour;
        bestData = h;
      }
    });

    return { hours: allHours, maxRate: max, bestHour: best, bestHourData: bestData };
  }, [data]);

  return (
    <Card>
      <CardContent className="py-4 px-5">
        {/* Featured insight callout (#12) */}
        {bestHour >= 0 && bestHourData && (
          <div className="flex items-center gap-3 mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 shrink-0">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatHourFull(bestHour)}</p>
              <p className="text-xs text-muted-foreground">
                Best time to send — {bestHourData.reply_rate.toFixed(1)}% reply rate
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Time-of-Day Performance</h3>
            <p className="text-xs text-muted-foreground">Reply rate by hour of day</p>
          </div>
        </div>

        <TooltipProvider delayDuration={0}>
          <div className="grid grid-cols-12 gap-1.5">
            {hours.map((h) => (
              <Tooltip key={h.hour}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full aspect-square rounded-md transition-colors cursor-default min-h-[36px]",
                        getReplyRateColor(h.reply_rate, maxRate),
                        h.hour === bestHour && "ring-2 ring-blue-400 ring-offset-1 ring-offset-background"
                      )}
                    />
                    <span className="text-[8px] text-muted-foreground">{formatHour(h.hour)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{formatHour(h.hour)} — {h.reply_rate.toFixed(1)}% reply rate</p>
                  <p className="text-muted-foreground">{h.sent} sent, {h.replied} replied</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-[9px] text-muted-foreground">Low</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/30" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-900/40" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-700/50" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-500/70" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-400" />
          <span className="text-[9px] text-muted-foreground">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
