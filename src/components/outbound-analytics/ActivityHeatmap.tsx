import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DailyActivityData } from "@/hooks/useOutboundAnalytics";

type HeatmapMetric = "sent" | "replied" | "link_sent" | "booked";

interface ActivityHeatmapProps {
  data: DailyActivityData[];
}

const METRIC_OPTIONS: { value: HeatmapMetric; label: string }[] = [
  { value: "sent", label: "Sent" },
  { value: "replied", label: "Replied" },
  { value: "link_sent", label: "Links Sent" },
  { value: "booked", label: "Booked" },
];

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/50";
  const ratio = value / max;
  if (ratio <= 0.25) return "bg-emerald-900/40";
  if (ratio <= 0.5) return "bg-emerald-700/60";
  if (ratio <= 0.75) return "bg-emerald-500/80";
  return "bg-emerald-400";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [metric, setMetric] = useState<HeatmapMetric>("sent");

  const { weeks, max, monthLabels } = useMemo(() => {
    if (!data.length) return { weeks: [], max: 0, monthLabels: [] };

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const dayMap = new Map<string, DailyActivityData>();
    sorted.forEach((d) => dayMap.set(d.date, d));

    // Build grid from first to last date
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);

    // Align start to Monday
    const startDay = start.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    start.setDate(start.getDate() - offset);

    const allDays: { date: string; value: number; dayOfWeek: number }[] = [];
    const cursor = new Date(start);
    let maxVal = 0;

    while (cursor <= end) {
      const dateStr = cursor.toISOString().split("T")[0];
      const dayData = dayMap.get(dateStr);
      const value = dayData ? dayData[metric] : 0;
      if (value > maxVal) maxVal = value;
      allDays.push({
        date: dateStr,
        value,
        dayOfWeek: cursor.getDay() === 0 ? 6 : cursor.getDay() - 1,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Group into weeks
    const weekGroups: typeof allDays[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekGroups.push(allDays.slice(i, i + 7));
    }

    // Month labels
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = "";
    weekGroups.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      const monthStr = firstDay.toLocaleDateString("en-US", { month: "short" });
      if (monthStr !== lastMonth) {
        labels.push({ label: monthStr, weekIndex: wi });
        lastMonth = monthStr;
      }
    });

    return { weeks: weekGroups, max: maxVal, monthLabels: labels };
  }, [data, metric]);

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Activity Heatmap</h3>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  metric === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity data available.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex ml-8 mb-1">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] text-muted-foreground"
                  style={{
                    position: "relative",
                    left: `${m.weekIndex * 14}px`,
                    marginRight: i < monthLabels.length - 1 ? 0 : undefined,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="h-[12px] flex items-center">
                    <span className="text-[9px] text-muted-foreground w-6 text-right">{label}</span>
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <TooltipProvider delayDuration={0}>
                <div className="flex gap-[2px]">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[2px]">
                      {Array.from({ length: 7 }).map((_, di) => {
                        const day = week.find((d) => d.dayOfWeek === di);
                        if (!day) {
                          return <div key={di} className="w-[12px] h-[12px]" />;
                        }
                        return (
                          <Tooltip key={di}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "w-[12px] h-[12px] rounded-[2px] transition-colors cursor-default",
                                  getIntensityClass(day.value, max)
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{day.value} {metric.replace("_", " ")}</p>
                              <p className="text-muted-foreground">{day.date}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-2 ml-8">
              <span className="text-[9px] text-muted-foreground">Less</span>
              <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/50" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-900/40" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-700/60" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/80" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400" />
              <span className="text-[9px] text-muted-foreground">More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
