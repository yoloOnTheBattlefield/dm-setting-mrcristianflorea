import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DailyActivityData } from "@/hooks/useOutboundAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

type ViewMode = "stacked" | "sent" | "replied" | "link_sent" | "booked";

interface DailyPerformanceChartProps {
  data: DailyActivityData[];
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "stacked", label: "Stacked" },
  { value: "sent", label: "Sent" },
  { value: "replied", label: "Replied" },
  { value: "link_sent", label: "Links Sent" },
  { value: "booked", label: "Booked" },
];

const COLORS = {
  sent: "hsl(260 60% 55%)",
  replied: "hsl(45 90% 55%)",
  link_sent: "hsl(280 65% 60%)",
  booked: "hsl(150 60% 45%)",
};

export function DailyPerformanceChart({ data }: DailyPerformanceChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("stacked");

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: format(parseISO(d.date), "MMM d"),
    }));
  }, [data]);

  const isStacked = viewMode === "stacked";

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Daily Performance</h3>
            <p className="text-xs text-muted-foreground">Volume vs downstream performance</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No daily data available.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={0}>
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10 }} />
                {(isStacked || viewMode === "sent") && (
                  <Bar
                    dataKey="sent"
                    name="Sent"
                    fill={COLORS.sent}
                    stackId={isStacked ? "stack" : undefined}
                    radius={isStacked ? undefined : [2, 2, 0, 0]}
                  />
                )}
                {(isStacked || viewMode === "replied") && (
                  <Bar
                    dataKey="replied"
                    name="Replied"
                    fill={COLORS.replied}
                    stackId={isStacked ? "stack" : undefined}
                    radius={isStacked ? undefined : [2, 2, 0, 0]}
                  />
                )}
                {(isStacked || viewMode === "link_sent") && (
                  <Bar
                    dataKey="link_sent"
                    name="Links Sent"
                    fill={COLORS.link_sent}
                    stackId={isStacked ? "stack" : undefined}
                    radius={isStacked ? undefined : [2, 2, 0, 0]}
                  />
                )}
                {(isStacked || viewMode === "booked") && (
                  <Bar
                    dataKey="booked"
                    name="Booked"
                    fill={COLORS.booked}
                    stackId={isStacked ? "stack" : undefined}
                    radius={isStacked ? [2, 2, 0, 0] : [2, 2, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
