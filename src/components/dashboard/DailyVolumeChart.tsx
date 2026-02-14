import { DailyVolume, SourceFilter } from "@/lib/types";
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
  source: SourceFilter;
}

export function DailyVolumeChart({ data, source }: DailyVolumeChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  const isInbound = source === "inbound";
  const isOutbound = source === "outbound";

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
      <h2 className="mb-1 text-base sm:text-lg font-semibold">Daily Pipeline Volume</h2>
      <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
        Track consistency and identify overload periods
      </p>

      <div className="h-48 sm:h-64">
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
              iconSize={6}
              wrapperStyle={{ fontSize: 10 }}
            />
            {/* Inbound bars */}
            {!isOutbound && (
              <>
                <Bar
                  dataKey="created"
                  name="Created"
                  fill="hsl(var(--stage-created))"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="link_sent"
                  name="Link Sent"
                  fill="hsl(var(--stage-link-sent))"
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
              </>
            )}
            {/* Outbound bars */}
            {!isInbound && (
              <>
                <Bar
                  dataKey="ob_messaged"
                  name="OB Messaged"
                  fill="hsl(260 60% 55%)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="ob_replied"
                  name="OB Replied"
                  fill="hsl(45 90% 55%)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="ob_booked"
                  name="OB Booked"
                  fill="hsl(150 60% 45%)"
                  radius={[2, 2, 0, 0]}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
