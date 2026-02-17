import { useMemo } from "react";
import { CumulativeBooking, SourceFilter } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, startOfWeek, startOfMonth } from "date-fns";

interface CumulativeBookingsChartProps {
  data: CumulativeBooking[];
  source: SourceFilter;
}

/** For cumulative data, take the last (highest) entry per bucket */
function sampleCumulative(data: CumulativeBooking[], mode: "week" | "month"): CumulativeBooking[] {
  const buckets = new Map<string, CumulativeBooking>();
  for (const d of data) {
    const date = parseISO(d.date);
    const key = mode === "week"
      ? startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10)
      : startOfMonth(date).toISOString().slice(0, 10);
    // Last entry per bucket wins (data is chronological, so later entries overwrite)
    buckets.set(key, { ...d, date: key });
  }
  return Array.from(buckets.values());
}

export function CumulativeBookingsChart({ data, source }: CumulativeBookingsChartProps) {
  const formattedData = useMemo(() => {
    let sampled: CumulativeBooking[];
    let fmt: string;
    if (data.length > 180) {
      sampled = sampleCumulative(data, "month");
      fmt = "MMM yyyy";
    } else if (data.length > 60) {
      sampled = sampleCumulative(data, "week");
      fmt = "MMM d";
    } else {
      sampled = data;
      fmt = "MMM d";
    }
    return sampled.map((d) => ({
      ...d,
      displayDate: format(parseISO(d.date), fmt),
    }));
  }, [data]);

  const isInbound = source === "inbound";
  const isOutbound = source === "outbound";
  const isAll = source === "all";

  const lastEntry = data[data.length - 1];
  const total = isOutbound
    ? lastEntry?.ob_cumulative ?? 0
    : isAll
    ? lastEntry?.combined_cumulative ?? 0
    : lastEntry?.cumulative ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm h-full flex flex-col">
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold">Cumulative Bookings</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track momentum over time
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl sm:text-3xl font-bold text-stage-booked">{total}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">total bookings</p>
        </div>
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--stage-booked))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--stage-booked))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="obBookingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(150 60% 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(150 60% 45%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="combinedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(260 60% 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(260 60% 55%)" stopOpacity={0.05} />
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
            />
            {isAll && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            )}
            {/* Inbound line */}
            {!isOutbound && (
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Inbound"
                stroke="hsl(var(--stage-booked))"
                strokeWidth={2}
                fill="url(#bookingGradient)"
              />
            )}
            {/* Outbound line */}
            {!isInbound && (
              <Area
                type="monotone"
                dataKey="ob_cumulative"
                name="Outbound"
                stroke="hsl(150 60% 45%)"
                strokeWidth={2}
                fill="url(#obBookingGradient)"
              />
            )}
            {/* Combined line (all mode only) */}
            {isAll && (
              <Area
                type="monotone"
                dataKey="combined_cumulative"
                name="Combined"
                stroke="hsl(260 60% 55%)"
                strokeWidth={2}
                strokeDasharray="5 3"
                fill="url(#combinedGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
