import { FunnelMetrics } from "@/lib/types";
import { StatCard } from "./StatCard";
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

interface FunnelOverviewProps {
  metrics: FunnelMetrics;
}

export function FunnelOverview({ metrics }: FunnelOverviewProps) {
  const funnelData = [
    { name: "Created", value: metrics.totalContacts, fill: "hsl(var(--stage-created))" },
    { name: "Qualified", value: metrics.qualifiedCount, fill: "hsl(var(--stage-qualified))" },
    { name: "Booked", value: metrics.bookedCount, fill: "hsl(var(--stage-booked))" },
  ];

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Funnel Overview</h2>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Contacts"
          value={metrics.totalContacts}
          variant="created"
        />
        <StatCard
          label="Qualified"
          value={metrics.qualifiedCount}
          subValue={`${metrics.qualificationRate.toFixed(1)}% rate`}
          variant="qualified"
          trend={metrics.qualificationRate > 50 ? "up" : "neutral"}
        />
        <StatCard
          label="Booked"
          value={metrics.bookedCount}
          subValue={`${metrics.bookingRate.toFixed(1)}% of qualified`}
          variant="booked"
          trend={metrics.bookingRate > 40 ? "up" : "neutral"}
        />
        <StatCard
          label="Ghosted"
          value={metrics.ghostedCount}
          subValue={`${metrics.ghostRate.toFixed(1)}% rate`}
          variant="ghosted"
          trend={metrics.ghostRate < 20 ? "up" : "down"}
        />
        <StatCard
          label="FUP Recovery"
          value={metrics.fupToBookedCount}
          subValue={`${metrics.recoveryRate.toFixed(1)}% of ${metrics.fupCount} FUPs`}
          variant="fup"
          trend={metrics.recoveryRate > 25 ? "up" : "neutral"}
        />
      </div>

      <div className="mt-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical" barSize={32}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value: number) => [value, "Count"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fill="hsl(var(--foreground))"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
