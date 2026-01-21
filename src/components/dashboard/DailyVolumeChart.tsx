import { DailyVolume } from "@/lib/types";
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

interface DailyVolumeChartProps {
  data: DailyVolume[];
}

export function DailyVolumeChart({ data }: DailyVolumeChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Daily Pipeline Volume</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Track consistency and identify overload periods
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} barGap={0}>
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
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="created"
              name="Created"
              fill="hsl(var(--stage-created))"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="qualified"
              name="Qualified"
              fill="hsl(var(--stage-qualified))"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="booked"
              name="Booked"
              fill="hsl(var(--stage-booked))"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="ghosted"
              name="Ghosted"
              fill="hsl(var(--stage-ghosted))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
