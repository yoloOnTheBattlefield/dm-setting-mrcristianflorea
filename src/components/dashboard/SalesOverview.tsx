import { SalesMetrics } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  Eye,
  DollarSign,
  TrendingUp,
} from "lucide-react";

function rateColor(rate: number): string {
  if (rate >= 70) return "text-green-500";
  if (rate >= 40) return "text-amber-500";
  return "text-red-500";
}

const SOURCE_COLORS: Record<string, string> = {
  ig: "#C8377A",
  instagram: "#C8377A",
  youtube: "#F60004",
  yt: "#F60004",
  email: "#3B82F6",
  direct: "#6B7280",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source.toLowerCase()] || "#8B5CF6";
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

interface SalesOverviewProps {
  metrics: SalesMetrics;
}

export function SalesOverview({ metrics }: SalesOverviewProps) {
  const chartData = metrics.by_source.map((s) => ({
    ...s,
    fill: getSourceColor(s.source),
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">Sales Performance</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <CheckCircle2 className="h-5 w-5 mb-1.5 text-green-500" />
            <span className={cn("text-2xl font-bold", rateColor(metrics.overall_close_rate))}>
              {metrics.overall_close_rate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Close Rate</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <Eye className="h-5 w-5 mb-1.5 text-blue-500" />
            <span className={cn("text-2xl font-bold", rateColor(metrics.overall_show_up_rate))}>
              {metrics.overall_show_up_rate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Show-up Rate</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <DollarSign className="h-5 w-5 mb-1.5 text-emerald-500" />
            <span className="text-2xl font-bold">
              {formatCurrency(metrics.total_revenue)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Total Revenue</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <TrendingUp className="h-5 w-5 mb-1.5 text-purple-500" />
            <span className="text-2xl font-bold">
              {formatCurrency(metrics.avg_deal_value)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Avg Deal Value</span>
          </CardContent>
        </Card>
      </div>

      {/* Close Rate by Source + Source Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-medium mb-4">Close Rate by Source</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, _name: string, props: { payload: typeof chartData[number] }) => {
                      const d = props.payload;
                      return [
                        `${value.toFixed(1)}%  (${d.completed}/${d.bookings} bookings, ${formatCurrency(d.revenue)})`,
                        "Close Rate",
                      ];
                    }}
                  />
                  <Bar
                    dataKey="close_rate"
                    name="Close Rate"
                    radius={[0, 4, 4, 0]}
                    fill="#3B82F6"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    shape={(props: any) => {
                      const { fill: _fill, ...rest } = props;
                      return <rect {...rest} fill={getSourceColor(props.source || "")} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No booking data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-medium mb-4">Source Breakdown</h3>
            {metrics.by_source.length > 0 ? (
              <div className="space-y-3">
                {metrics.by_source.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getSourceColor(s.source) }}
                      />
                      <span className="font-medium capitalize">{s.source}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.bookings} calls</span>
                      <span className={cn("font-medium", rateColor(s.close_rate))}>
                        {s.close_rate.toFixed(0)}%
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No source data.</p>
            )}

            {/* Top Mediums */}
            {metrics.by_medium.length > 0 && (
              <>
                <h3 className="text-sm font-medium mt-6 mb-3">Top Mediums</h3>
                <div className="space-y-2">
                  {metrics.by_medium.slice(0, 5).map((m) => (
                    <div key={m.medium} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[140px]" title={m.medium}>
                        {m.medium}
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{m.bookings}</span>
                        <span className={cn("font-medium", rateColor(m.close_rate))}>
                          {m.close_rate.toFixed(0)}%
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(m.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
