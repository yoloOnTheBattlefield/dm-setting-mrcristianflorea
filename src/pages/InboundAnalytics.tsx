import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  useInboundOverview,
  useInboundPosts,
  useInboundDaily,
  type PostPerformance,
} from "@/hooks/useInboundAnalytics";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CalendarCheck,
  CheckCircle,
  DollarSign,
  ArrowRight,
  ArrowUpDown,
  Filter,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Helpers ───

function fmtRate(v: number | null | undefined) {
  return v != null ? `${v.toFixed(1)}%` : "—";
}

function rateColor(rate: number) {
  if (rate >= 20) return "text-[#22C55E]";
  if (rate >= 10) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function truncatePostUrl(url: string) {
  if (url === "unknown") return null;
  try {
    const u = new URL(url);
    return u.pathname.length > 30
      ? `${u.hostname}${u.pathname.slice(0, 30)}...`
      : `${u.hostname}${u.pathname}`;
  } catch {
    return url.length > 40 ? `${url.slice(0, 40)}...` : url;
  }
}

// ─── Sort types ───

type PostSortField = keyof Pick<
  PostPerformance,
  "total" | "booked" | "closed" | "book_rate" | "revenue"
>;
type SortDir = "asc" | "desc";

// ─── Component ───

export default function InboundAnalytics() {
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>(
    "ib-analytics-dateRange",
    "all",
  );

  const [postSortField, setPostSortField] = useState<PostSortField>("total");
  const [postSortDir, setPostSortDir] = useState<SortDir>("desc");

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

  const filterParams = { start_date: startDate, end_date: endDate };

  const { data: overview, isLoading: overviewLoading } =
    useInboundOverview(filterParams);
  const { data: postsData, isLoading: postsLoading } =
    useInboundPosts(filterParams);
  const { data: dailyData } = useInboundDaily(filterParams);

  // Sort posts
  const sortedPosts = useMemo(() => {
    const posts = postsData?.posts || [];
    return [...posts].sort((a, b) => {
      const aVal = a[postSortField] ?? 0;
      const bVal = b[postSortField] ?? 0;
      return postSortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [postsData, postSortField, postSortDir]);

  function handlePostSort(field: PostSortField) {
    if (postSortField === field) {
      setPostSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setPostSortField(field);
      setPostSortDir("desc");
    }
  }

  const SortIndicator = ({ field }: { field: PostSortField }) => (
    <ArrowUpDown
      className={cn(
        "inline h-3 w-3 ml-1",
        postSortField === field
          ? "text-foreground"
          : "text-muted-foreground/40",
      )}
    />
  );

  // Daily chart data
  const chartData = useMemo(() => {
    if (!dailyData?.days) return [];
    return dailyData.days.map((d) => ({
      ...d,
      label: d.date.slice(5), // MM-DD
    }));
  }, [dailyData]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky filter toolbar */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between gap-4">
          <div className="shrink-0">
            <h2 className="text-2xl font-bold tracking-tight">
              Inbound Analytics
            </h2>
            <p className="text-muted-foreground text-sm">
              Track which posts and sources drive the most leads and revenue
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-card px-3 py-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">
                Date Range
              </span>
              <DateFilter value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {overviewLoading ? (
          <DashboardSkeleton />
        ) : overview ? (
          <>
            {/* KPI Cards */}
            <div className="flex items-center gap-1.5">
              <KpiCard
                label="Total Leads"
                value={overview.total}
                icon={
                  <Users className="h-4 w-4" style={{ color: "#4F6EF7" }} />
                }
              />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <KpiCard
                label="Booked"
                value={overview.booked}
                sub={
                  overview.total > 0
                    ? `${overview.book_rate.toFixed(1)}% of leads`
                    : undefined
                }
                icon={
                  <CalendarCheck
                    className="h-4 w-4"
                    style={{ color: "#7B68EE" }}
                  />
                }
              />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <KpiCard
                label="Closed"
                value={overview.closed}
                sub={
                  overview.booked > 0
                    ? `${overview.close_rate.toFixed(1)}% of booked`
                    : undefined
                }
                icon={
                  <CheckCircle
                    className="h-4 w-4"
                    style={{ color: "#22C55E" }}
                  />
                }
              />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <KpiCard
                label="Book Rate"
                value={`${overview.book_rate.toFixed(1)}%`}
                icon={
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#F59E0B" }}
                  />
                }
              />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <KpiCard
                label="Revenue"
                value={`$${overview.revenue.toLocaleString()}`}
                sub={`${overview.closed} deal${overview.closed !== 1 ? "s" : ""}`}
                icon={
                  <DollarSign
                    className="h-5 w-5"
                    style={{ color: "#22C55E" }}
                  />
                }
                highlight
              />
            </div>

            {/* Source Breakdown */}
            {overview.sources.length > 0 && (
              <Card>
                <CardContent className="py-4 px-6">
                  <h3 className="text-sm font-medium mb-3">
                    Source Breakdown
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Booked</TableHead>
                        <TableHead className="text-right">Closed</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.sources.map((s) => (
                        <TableRow key={s.source}>
                          <TableCell className="font-medium text-sm">
                            {s.source}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.total}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.booked}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.closed}
                          </TableCell>
                          <TableCell className="text-right">
                            ${s.revenue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Post Performance Table */}
            <Card>
              <CardContent className="py-4 px-6">
                <h3 className="text-sm font-medium mb-3">
                  Post Performance
                </h3>
                {postsLoading ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No post data yet. Configure ManyChat to send{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      post_url
                    </code>{" "}
                    in the webhook body.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => handlePostSort("total")}
                        >
                          Leads
                          <SortIndicator field="total" />
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => handlePostSort("booked")}
                        >
                          Booked
                          <SortIndicator field="booked" />
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => handlePostSort("closed")}
                        >
                          Closed
                          <SortIndicator field="closed" />
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => handlePostSort("book_rate")}
                        >
                          Book Rate
                          <SortIndicator field="book_rate" />
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() => handlePostSort("revenue")}
                        >
                          Revenue
                          <SortIndicator field="revenue" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPosts.map((p) => {
                        const display = truncatePostUrl(p.post_url);
                        return (
                          <TableRow key={p.post_url}>
                            <TableCell className="max-w-[280px]">
                              {display ? (
                                <a
                                  href={p.post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
                                >
                                  {display}
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  No post tracked
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {p.total}
                            </TableCell>
                            <TableCell className="text-right">
                              {p.booked}
                            </TableCell>
                            <TableCell className="text-right">
                              {p.closed}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium",
                                rateColor(p.book_rate),
                              )}
                            >
                              {fmtRate(p.book_rate)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${p.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Daily Trend Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardContent className="py-4 px-6">
                  <h3 className="text-sm font-medium mb-3">Daily Volume</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                          }}
                        />
                        <Legend
                          iconSize={8}
                          wrapperStyle={{ fontSize: 12 }}
                        />
                        <Bar
                          dataKey="created"
                          name="Leads"
                          fill="#7B68EE"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="booked"
                          name="Booked"
                          fill="#22C55E"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="closed"
                          name="Closed"
                          fill="#F59E0B"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No inbound data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───

function KpiCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  const isZero =
    (typeof value === "number" && value === 0) ||
    (typeof value === "string" && (value === "$0" || value === "0.0%"));

  return (
    <Card
      className={cn(
        "flex-1 min-w-0 transition-colors",
        highlight && "bg-[#F0FDF4] border-[#22C55E]/20",
      )}
    >
      <CardContent className="py-2.5 px-3 flex items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">
            {label}
          </p>
          <p
            className={cn(
              "font-bold leading-tight",
              highlight ? "text-xl" : "text-lg",
              isZero && "text-[#A0AEC0]",
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-muted-foreground leading-tight">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
