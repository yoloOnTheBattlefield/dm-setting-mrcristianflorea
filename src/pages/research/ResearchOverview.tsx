import { format } from "date-fns";
import {
  BarChart3,
  Eye,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  useResearchOverviewKPIs,
  useResearchEngagementTrend,
  useResearchTopPosts,
} from "@/hooks/useResearchOverview";

const LINE_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b"];

export default function ResearchOverview() {
  const { data: kpis, isLoading: kpisLoading } = useResearchOverviewKPIs();
  const { data: trend, isLoading: trendLoading } =
    useResearchEngagementTrend();
  const { data: topPosts, isLoading: postsLoading } = useResearchTopPosts();

  // Derive the competitor handles (line keys) from the first data point
  const lineKeys: string[] = [];
  if (trend && trend.length > 0) {
    for (const key of Object.keys(trend[0])) {
      if (key !== "date") lineKeys.push(key);
    }
  }

  // Compute max value across all competitor series
  let maxValue = 0;
  if (trend && trend.length > 0) {
    for (const point of trend) {
      for (const key of lineKeys) {
        const v = Number((point as Record<string, unknown>)[key]) || 0;
        if (v > maxValue) maxValue = v;
      }
    }
  }
  const allZero = maxValue === 0;

  // Calculate nice Y-axis domain and ticks (4–5 clean marks)
  let yDomain: [number, number] = [0, 1];
  let yTicks: number[] = [0];
  if (!allZero) {
    const paddedMax = maxValue * 1.12;
    const rawInterval = paddedMax / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const residual = rawInterval / mag;
    const niceInterval =
      residual <= 1.5 ? mag : residual <= 3.5 ? 2 * mag : residual <= 7.5 ? 5 * mag : 10 * mag;
    const ticks: number[] = [];
    for (let t = 0; t <= paddedMax + niceInterval * 0.5; t += niceInterval) {
      ticks.push(t);
    }
    yTicks = ticks;
    yDomain = [0, ticks[ticks.length - 1]];
  }

  const kpiCards = [
    {
      label: "Posts Tracked",
      value: kpis?.postsTracked,
      icon: BarChart3,
    },
    {
      label: "Comments Analyzed",
      value: kpis?.commentsAnalyzed,
      icon: MessageSquare,
    },
    {
      label: "Unique Commenters",
      value: kpis?.uniqueCommenters,
      icon: Users,
    },
    {
      label: "Keyword Spikes",
      value: kpis?.keywordSpikes,
      icon: TrendingUp,
    },
    {
      label: "Lead Magnet Posts",
      value: kpis?.leadMagnetPosts,
      icon: Sparkles,
    },
    {
      label: "New Posts Since Login",
      value: kpis?.newPostsSinceLogin,
      icon: Eye,
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Sticky header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Research Overview
          </h2>
          <p className="text-muted-foreground">
            Instagram intelligence dashboard
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {kpi.value?.toLocaleString() ?? "—"}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : allZero ? (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
                No engagement data for this period. Run a scrape job to populate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) =>
                      format(new Date(val), "MMM d")
                    }
                    fontSize={12}
                  />
                  <YAxis
                    fontSize={12}
                    domain={yDomain}
                    ticks={yTicks}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    labelFormatter={(val: string) =>
                      format(new Date(val), "MMM d, yyyy")
                    }
                  />
                  <Legend />
                  {lineKeys.slice(0, 4).map((handle, i) => (
                    <Line
                      key={handle}
                      type="monotone"
                      dataKey={handle}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      name={`@${handle}`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Posts by Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPosts?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        @{post.competitorHandle}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {post.caption.length > 80
                          ? `${post.caption.slice(0, 80)}...`
                          : post.caption}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.postType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {post.commentsCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {format(new Date(post.postedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
