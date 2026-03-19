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
  ExternalLink,
  TrendingUp,
  Repeat2,
  Info,
  Loader2,
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
    30,
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

  // Sort posts — exclude "unknown" rows from the main table
  const { trackedPosts, unknownPost } = useMemo(() => {
    const posts = postsData?.posts || [];
    const unknown = posts.find((p) => p.post_url === "unknown");
    const tracked = posts
      .filter((p) => p.post_url !== "unknown")
      .sort((a, b) => {
        const aVal = a[postSortField] ?? 0;
        const bVal = b[postSortField] ?? 0;
        return postSortDir === "desc" ? bVal - aVal : aVal - bVal;
      });
    return { trackedPosts: tracked, unknownPost: unknown };
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

  // Daily chart data — trim leading zero-value days
  const chartData = useMemo(() => {
    if (!dailyData?.days) return [];
    const days = dailyData.days.map((d) => ({
      ...d,
      label: d.date.slice(5), // MM-DD
    }));

    // Find the first day with any non-zero value
    const firstActiveIdx = days.findIndex(
      (d) => d.created > 0 || d.booked > 0 || d.closed > 0,
    );
    if (firstActiveIdx === -1) return [];
    return days.slice(firstActiveIdx);
  }, [dailyData]);

  // Determine if sources are all "unknown"
  const hasRealSources = useMemo(() => {
    if (!overview?.sources) return false;
    return overview.sources.some(
      (s) => s.source !== "unknown" && s.source !== "",
    );
  }, [overview]);

  // Contextual subtitle
  const subtitle = useMemo(() => {
    if (!overview) return null;
    if (!hasRealSources && trackedPosts.length === 0) {
      return "Connect post tracking and UTM sources to unlock full attribution.";
    }
    return "Track which posts and sources drive the most leads and revenue.";
  }, [overview, hasRealSources, trackedPosts]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header with integrated date filter */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Inbound Analytics</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {overviewLoading ? (
          <DashboardSkeleton />
        ) : overview ? (
          <>
            {/* KPI Cards — uniform grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <KpiCard
                label="Total Leads"
                value={overview.total}
                icon={
                  <Users className="h-4 w-4" style={{ color: "#4F6EF7" }} />
                }
              />
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
              <KpiCard
                label="Book Rate"
                value={`${overview.book_rate.toFixed(1)}%`}
                rateValue={overview.book_rate}
                icon={
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#F59E0B" }}
                  />
                }
              />
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
              {overview.cross_channel > 0 && (
                <KpiCard
                  label="Cross-Channel"
                  value={overview.cross_channel}
                  sub={`${overview.cross_channel_rate.toFixed(1)}% were outbound first`}
                  icon={
                    <Repeat2
                      className="h-4 w-4"
                      style={{ color: "#F59E0B" }}
                    />
                  }
                />
              )}
            </div>

            {/* Source Breakdown */}
            <Card>
              <CardContent className="py-4 px-6">
                <h3 className="text-sm font-medium mb-3">Source Breakdown</h3>
                {!hasRealSources ? (
                  <div className="py-8 text-center">
                    <Info className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No UTM source data detected.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Tag your links with{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                        ?utm_source=...
                      </code>{" "}
                      to track where leads come from.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Booked</TableHead>
                        <TableHead className="text-right">Book Rate</TableHead>
                        <TableHead className="text-right">Closed</TableHead>
                        <TableHead className="text-right">Close Rate</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.sources
                        .filter((s) => s.source !== "unknown")
                        .map((s) => {
                          const bookRate =
                            s.total > 0 ? (s.booked / s.total) * 100 : 0;
                          const closeRate =
                            s.booked > 0 ? (s.closed / s.booked) * 100 : 0;
                          return (
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
                              <TableCell
                                className={cn(
                                  "text-right text-sm",
                                  rateColor(bookRate),
                                )}
                              >
                                {fmtRate(bookRate)}
                              </TableCell>
                              <TableCell className="text-right">
                                {s.closed}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right text-sm",
                                  rateColor(closeRate),
                                )}
                              >
                                {fmtRate(closeRate)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${s.revenue.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Post Performance Table */}
            <Card>
              <CardContent className="py-4 px-6">
                <h3 className="text-sm font-medium mb-3">Post Performance</h3>
                {postsLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : trackedPosts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Info className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No post tracking data yet.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Configure ManyChat to send{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                        post_url
                      </code>{" "}
                      in the webhook body to track which posts drive leads.
                    </p>
                    {unknownPost && unknownPost.total > 0 && (
                      <p className="text-xs text-muted-foreground/50 mt-3">
                        {unknownPost.total} lead
                        {unknownPost.total !== 1 ? "s" : ""} with no post
                        attributed
                        {unknownPost.revenue > 0 &&
                          ` ($${unknownPost.revenue.toLocaleString()} revenue)`}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
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
                        {trackedPosts.map((p) => {
                          const display = truncatePostUrl(p.post_url);
                          return (
                            <TableRow key={p.post_url}>
                              <TableCell className="max-w-[280px]">
                                {display ? (
                                  <a
                                    href={p.post_url}
                                    target="_blank" rel="noopener noreferrer"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
                                  >
                                    {display}
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">
                                    Unknown
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
                    {unknownPost && unknownPost.total > 0 && (
                      <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                        + {unknownPost.total} lead
                        {unknownPost.total !== 1 ? "s" : ""} with no post
                        attributed
                      </p>
                    )}
                  </>
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
  rateValue,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
  rateValue?: number;
}) {
  const isZero =
    (typeof value === "number" && value === 0) ||
    (typeof value === "string" && (value === "$0" || value === "0.0%"));

  return (
    <Card
      className={cn(
        "transition-colors",
        highlight && "bg-[#F0FDF4] border-[#22C55E]/20",
      )}
    >
      <CardContent className="py-3 px-4 flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground leading-tight">
            {label}
          </p>
          <p
            className={cn(
              "text-lg font-bold leading-tight",
              highlight && "text-xl",
              isZero && "text-[#A0AEC0]",
              rateValue != null && rateColor(rateValue),
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
