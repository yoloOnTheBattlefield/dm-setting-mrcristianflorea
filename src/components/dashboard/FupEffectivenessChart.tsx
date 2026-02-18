import { FupEffectiveness } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface FupEffectivenessChartProps {
  data: FupEffectiveness;
}

export function FupEffectivenessChart({ data }: FupEffectivenessChartProps) {
  const chartData = [
    { name: "Converted", value: data.convertedToBooked, fill: "hsl(var(--stage-booked))" },
    { name: "Remaining Inactive", value: data.remainingInactive, fill: "hsl(var(--muted))" },
  ];

  if (data.totalFup === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Follow-up Effectiveness</h2>
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No follow-ups in this period
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Follow-up Effectiveness</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Do follow-ups convert? ({data.totalFup} total FUPs)
      </p>

      <div className="flex items-center gap-6">
        <div className="h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-stage-booked" />
              <span className="text-sm text-muted-foreground">Converted</span>
            </div>
            <p className="ml-5 text-xl font-bold text-stage-booked">
              {data.convertedToBooked}{" "}
              <span className="text-sm font-normal">
                ({data.conversionRate.toFixed(1)}%)
              </span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-sm text-muted-foreground">Inactive</span>
            </div>
            <p className="ml-5 text-xl font-bold text-muted-foreground">
              {data.remainingInactive}{" "}
              <span className="text-sm font-normal">
                ({data.inactiveRate.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
