import { VelocityMetrics } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface VelocityChartProps {
  metrics: VelocityMetrics;
}

function formatHours(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function VelocityChart({ metrics }: VelocityChartProps) {
  const data = [
    {
      name: "Created → Link Sent",
      median: metrics.createdToLinkSent.median,
      average: metrics.createdToLinkSent.average,
      fill: "hsl(var(--stage-link-sent))",
    },
    {
      name: "Link Sent → Booked",
      median: metrics.linkSentToBooked.median,
      average: metrics.linkSentToBooked.average,
      fill: "hsl(var(--stage-booked))",
    },
    {
      name: "Created → Ghosted",
      median: metrics.createdToGhosted.median,
      average: metrics.createdToGhosted.average,
      fill: "hsl(var(--stage-ghosted))",
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm h-full flex flex-col">
      <h2 className="mb-1 text-base sm:text-lg font-semibold">Stage Velocity</h2>
      <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
        Median time between stages (faster is better)
      </p>

      <div className="mb-3 sm:mb-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4">
        {data.map((item) => (
          <div key={item.name} className="min-w-0 sm:min-w-[140px]">
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.name}</p>
            <p className="text-lg sm:text-2xl font-bold" style={{ color: item.fill }}>
              {formatHours(item.median)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              avg: {formatHours(item.average)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={24}>
            <XAxis
              type="number"
              tickFormatter={formatHours}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value: number) => [formatHours(value), "Median"]}
            />
            <Bar dataKey="median" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
