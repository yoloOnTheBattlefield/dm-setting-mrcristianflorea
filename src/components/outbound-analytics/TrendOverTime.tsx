import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendData } from "@/hooks/useOutboundAnalytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TrendOverTimeProps {
  data: TrendData[];
}

export function TrendOverTime({ data }: TrendOverTimeProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: format(parseISO(d.date), "MMM d"),
    }));
  }, [data]);

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="mb-3">
          <h3 className="text-sm font-medium">7-Day Rolling Performance</h3>
          <p className="text-xs text-muted-foreground">Momentum trends for reply and booking rates</p>
        </div>

        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No trend data available.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  width={35}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="reply_rate_7d"
                  name="Reply Rate (7d)"
                  stroke="hsl(45 90% 55%)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="booked_rate_7d"
                  name="Booked Rate (7d)"
                  stroke="hsl(150 60% 45%)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
