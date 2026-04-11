import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useBookingAnalytics, type ChannelMetrics } from "@/hooks/useBookings";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { StatCardsSkeleton, ChartCardSkeleton } from "@/components/skeletons";

function rateColor(rate: number): string {
  if (rate >= 70) return "text-green-500";
  if (rate >= 40) return "text-amber-500";
  return "text-red-500";
}

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
const CHANNEL_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  LinkedIn: "#0A66C2",
  YouTube: "#FF0000",
  Facebook: "#1877F2",
  TikTok: "#000000",
  Email: "#6B7280",
  "Direct": "#8B5CF6",
  "Outbound DM": "#F59E0B",
};

function getChannelColor(channel: string, idx: number): string {
  return CHANNEL_COLORS[channel] || PIE_COLORS[idx % PIE_COLORS.length];
}

export default function BookingAnalytics() {
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>(
    "booking-analytics-dateRange",
    30,
  );

  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0];
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().split("T")[0];
  }, [dateRange]);

  const { data, isLoading } = useBookingAnalytics({ start_date: startDate, end_date: endDate });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Booking Analytics</h1>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
        <StatCardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartCardSkeleton titleWidth="w-36" height={250} barCount={14} delay="200ms" />
          </div>
          <ChartCardSkeleton titleWidth="w-32" height={180} type="pie" delay="300ms" />
        </div>
      </div>
    );
  }

  const analytics = data;
  const byChannel = analytics?.by_channel ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Analytics</h1>
          <p className="text-sm text-muted-foreground">{analytics?.total ?? 0} total bookings analyzed</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <CheckCircle2 className="h-5 w-5 mb-1.5 text-green-500" />
            <span className={cn("text-2xl font-bold", rateColor(analytics?.close_rate ?? 0))}>
              {analytics?.close_rate?.toFixed(1) ?? 0}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Close Rate</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <Eye className="h-5 w-5 mb-1.5 text-blue-500" />
            <span className={cn("text-2xl font-bold", rateColor(analytics?.show_up_rate ?? 0))}>
              {analytics?.show_up_rate?.toFixed(1) ?? 0}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Show-up Rate</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <DollarSign className="h-5 w-5 mb-1.5 text-emerald-500" />
            <span className="text-2xl font-bold">${analytics?.avg_cash_collected?.toLocaleString() ?? 0}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Avg Cash Collected</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex flex-col items-center text-center">
            <TrendingUp className="h-5 w-5 mb-1.5 text-purple-500" />
            <span className="text-2xl font-bold">{analytics?.total ?? 0}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Total Bookings</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings Over Time */}
        <Card className="lg:col-span-2">
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-medium mb-4">Bookings Over Time</h3>
            {analytics?.over_time?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.over_time}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  />
                  <Bar dataKey="count" name="Bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No booking data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-medium mb-4">Source Distribution</h3>
            {analytics?.source_distribution?.length ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={analytics.source_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="count"
                      nameKey="source"
                    >
                      {analytics.source_distribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {analytics.source_distribution.map((s, i) => (
                    <div key={s.source} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize">{s.source}: {s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No source data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      {byChannel.length > 0 && (
        <>
          <h2 className="text-lg font-semibold tracking-tight">Performance by Channel</h2>

          {/* Channel Bar Chart — show rate vs close rate */}
          <Card>
            <CardContent className="py-4 px-5">
              <h3 className="text-sm font-medium mb-4">Show Rate vs Close Rate by Channel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byChannel} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="show_rate" name="Show Rate" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
                  <Bar dataKey="close_rate" name="Close Rate" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Channel Table */}
          <Card>
            <CardContent className="py-4 px-5">
              <h3 className="text-sm font-medium mb-4">Channel Breakdown</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Showed</TableHead>
                      <TableHead className="text-right">No-show</TableHead>
                      <TableHead className="text-right">Show Rate</TableHead>
                      <TableHead className="text-right">Close Rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byChannel.map((ch, i) => (
                      <TableRow key={ch.channel}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getChannelColor(ch.channel, i) }}
                            />
                            <span className="font-medium">{ch.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{ch.bookings}</TableCell>
                        <TableCell className="text-right">{ch.completed}</TableCell>
                        <TableCell className="text-right">{ch.no_show}</TableCell>
                        <TableCell className="text-right">
                          <span className={rateColor(ch.show_rate)}>{ch.show_rate.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={rateColor(ch.close_rate)}>{ch.close_rate.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${ch.revenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
