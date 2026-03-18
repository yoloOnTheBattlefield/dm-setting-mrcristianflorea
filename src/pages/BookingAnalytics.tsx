import { useState } from "react";
import { useBookingAnalytics } from "@/hooks/useBookings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function BookingAnalytics() {
  const { data, isLoading } = useBookingAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-2xl font-bold tracking-tight">Booking Analytics</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking Analytics</h1>
        <p className="text-sm text-muted-foreground">{analytics?.total ?? 0} total bookings analyzed</p>
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

      {/* Charts */}
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
    </div>
  );
}
