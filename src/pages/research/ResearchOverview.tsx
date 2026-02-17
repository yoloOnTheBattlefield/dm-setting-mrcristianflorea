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
                  <YAxis fontSize={12} />
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
