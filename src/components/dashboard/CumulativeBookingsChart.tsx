import { CumulativeBooking } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface CumulativeBookingsChartProps {
  data: CumulativeBooking[];
}

export function CumulativeBookingsChart({ data }: CumulativeBookingsChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  const total = data[data.length - 1]?.cumulative || 0;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cumulative Bookings</h2>
          <p className="text-sm text-muted-foreground">
            Track momentum over time
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-stage-booked">{total}</p>
          <p className="text-xs text-muted-foreground">total bookings</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--stage-booked))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--stage-booked))"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
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
              formatter={(value: number) => [value, "Total Bookings"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="hsl(var(--stage-booked))"
              strokeWidth={2}
              fill="url(#bookingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
