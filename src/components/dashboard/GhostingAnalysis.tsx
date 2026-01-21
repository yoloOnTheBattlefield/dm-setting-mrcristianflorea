import { GhostingBucket } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface GhostingAnalysisProps {
  data: GhostingBucket[];
}

export function GhostingAnalysis({ data }: GhostingAnalysisProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Ghosting Analysis</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        When do conversations die? ({total} total ghosted)
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <XAxis
              dataKey="bucket"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
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
              formatter={(value: number, name: string, props) => [
                `${value} (${props.payload.percentage.toFixed(1)}%)`,
                "Count",
              ]}
            />
            <Bar dataKey="count" fill="hsl(var(--stage-ghosted))" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="percentage"
                position="top"
                formatter={(value: number) => `${value.toFixed(0)}%`}
                fill="hsl(var(--muted-foreground))"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        {data[0]?.percentage > 30 && (
          <p className="text-stage-ghosted">
            ⚠️ High same-day drop-off. Consider faster initial response.
          </p>
        )}
        {data[3]?.percentage > 25 && (
          <p className="text-stage-ghosted">
            ⚠️ Late-stage ghosting detected. Review follow-up timing.
          </p>
        )}
      </div>
    </div>
  );
}
