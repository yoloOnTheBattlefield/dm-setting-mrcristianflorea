import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WeeklyHeatmapCell } from "@/hooks/useOutboundAnalytics";

type HeatmapMetric = "sent" | "replied" | "booked";

const METRIC_OPTIONS: { value: HeatmapMetric; label: string }[] = [
  { value: "sent", label: "Sent" },
  { value: "replied", label: "Replied" },
  { value: "booked", label: "Booked" },
];

// Reorder from Sun(0)...Sat(6) to Mon(1)...Sun(0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon=1, Tue=2, ..., Sun=0
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/30";
  const ratio = value / max;
  if (ratio <= 0.25) return "bg-emerald-200 dark:bg-emerald-900/50";
  if (ratio <= 0.5) return "bg-emerald-400 dark:bg-emerald-700/70";
  if (ratio <= 0.75) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-700 dark:bg-emerald-400";
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

interface WeeklyHeatmapProps {
  cells: WeeklyHeatmapCell[];
  isLoading: boolean;
  onMetricChange: (metric: string) => void;
  metric: string;
}

export function WeeklyHeatmap({ cells, isLoading, onMetricChange, metric }: WeeklyHeatmapProps) {
  const { grid, max } = useMemo(() => {
    const g: Record<string, number> = {};
    let m = 0;
    for (const cell of cells) {
      const key = `${cell.day}-${cell.hour}`;
      g[key] = cell.count;
      if (cell.count > m) m = cell.count;
    }
    return { grid: g, max: m };
  }, [cells]);

  // Show every 3rd hour label to avoid crowding
  const HOUR_RANGE = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-medium">Weekly Activity Heatmap</h3>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onMetricChange(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  metric === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider delayDuration={0}>
              <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
                {/* Header row: hour labels */}
                <div /> {/* empty corner */}
                {HOUR_RANGE.map((h) => (
                  <div key={h} className="text-[9px] text-muted-foreground text-center px-0.5">
                    {h % 3 === 0 ? formatHour(h) : ""}
                  </div>
                ))}

                {/* Data rows: one per day */}
                {DAY_ORDER.map((dayIdx, row) => (
                  <>
                    <div key={`label-${dayIdx}`} className="text-[10px] text-muted-foreground flex items-center justify-end pr-2 font-medium">
                      {DAY_LABELS[row]}
                    </div>
                    {HOUR_RANGE.map((h) => {
                      const count = grid[`${dayIdx}-${h}`] || 0;
                      return (
                        <Tooltip key={`${dayIdx}-${h}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-5 min-w-[18px] rounded-sm cursor-default transition-colors",
                                getIntensityClass(count, max),
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">
                              {DAY_LABELS[row]} {formatHour(h)}: {count} {metric}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </>
                ))}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[9px] text-muted-foreground">Less</span>
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/70" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-700 dark:bg-emerald-400" />
              <span className="text-[9px] text-muted-foreground">More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
