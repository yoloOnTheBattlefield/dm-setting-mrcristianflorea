import { useMemo } from "react";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useResearchCompetitor } from "@/hooks/useResearchCompetitors";
import { POSTS } from "@/lib/research-mock-data";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function CompetitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: competitor, isLoading } = useResearchCompetitor(id);

  const competitorPosts = useMemo(
    () => POSTS.filter((p) => p.competitorId === id).slice(0, 15),
    [id],
  );

  const leadMagnetPosts = useMemo(
    () => competitorPosts.filter((p) => p.hasLeadMagnetKeyword),
    [competitorPosts],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/research/competitors")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Not Found</h2>
              <p className="text-muted-foreground">
                This competitor could not be found.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No competitor with ID "{id}" exists. It may have been removed.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/research/competitors")}
              >
                Back to Competitors
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Sticky header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/research/competitors")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              @{competitor.handle}
            </h2>
            <p className="text-muted-foreground">Detailed competitor analysis</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Header Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>@{competitor.handle}</CardTitle>
            <CardDescription>Competitor profile summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-lg font-semibold">
                  {competitor.followers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posts Tracked</p>
                <p className="text-lg font-semibold">
                  {competitor.postsTracked}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Comments</p>
                <p className="text-lg font-semibold">
                  {competitor.avgComments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Lead Magnet Rate
                </p>
                <p className="text-lg font-semibold">
                  {(competitor.leadMagnetHitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Keyword</p>
                <Badge variant="outline" className="mt-1">
                  {competitor.topKeyword}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={`mt-1 ${STATUS_COLORS[competitor.trackingStatus] ?? ""}`}
                >
                  {competitor.trackingStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Post</p>
                <p className="text-lg font-semibold">
                  {format(new Date(competitor.lastPost), "MMM d")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="lead-magnets">Lead Magnets</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>
                  High-level insights for @{competitor.handle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Total Posts Analyzed
                      </p>
                      <p className="text-3xl font-bold">
                        {competitorPosts.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Avg Likes / Post
                      </p>
                      <p className="text-3xl font-bold">
                        {competitorPosts.length > 0
                          ? Math.round(
                              competitorPosts.reduce(
                                (s, p) => s + p.likesCount,
                                0,
                              ) / competitorPosts.length,
                            ).toLocaleString()
                          : "0"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Lead Magnet Posts
                      </p>
                      <p className="text-3xl font-bold">
                        {leadMagnetPosts.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground">
                  @{competitor.handle} has been tracked with{" "}
                  {competitor.postsTracked} posts. Their most common CTA keyword
                  is "{competitor.topKeyword}" and they maintain an average of{" "}
                  {competitor.avgComments} comments per post. The lead magnet hit
                  rate of {(competitor.leadMagnetHitRate * 100).toFixed(1)}%
                  indicates strong audience engagement with keyword-driven
                  funnels.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>
                  Posts tracked from @{competitor.handle}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {competitorPosts.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No posts tracked yet for this competitor.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caption</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Hook Style</TableHead>
                        <TableHead>CTA</TableHead>
                        <TableHead className="text-right">Comments</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead>Posted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitorPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="max-w-[250px] truncate">
                            {post.caption.length > 60
                              ? `${post.caption.slice(0, 60)}...`
                              : post.caption}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{post.postType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.hookStyle}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.ctaType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {post.commentsCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {post.likesCount.toLocaleString()}
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
          </TabsContent>

          {/* Lead Magnets Tab */}
          <TabsContent value="lead-magnets">
            <Card>
              <CardHeader>
                <CardTitle>Lead Magnet Analysis</CardTitle>
                <CardDescription>
                  Posts with detected lead magnet keywords from @
                  {competitor.handle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leadMagnetPosts.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No lead magnet posts detected for this competitor.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">
                            Lead Magnet Posts
                          </p>
                          <p className="text-3xl font-bold">
                            {leadMagnetPosts.length}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">
                            Avg Comments on LM Posts
                          </p>
                          <p className="text-3xl font-bold">
                            {Math.round(
                              leadMagnetPosts.reduce(
                                (s, p) => s + p.commentsCount,
                                0,
                              ) / leadMagnetPosts.length,
                            )}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">
                            Most Used Keyword
                          </p>
                          <p className="text-xl font-bold">
                            {competitor.topKeyword}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Caption</TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-right">
                            Comments
                          </TableHead>
                          <TableHead>Posted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadMagnetPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="max-w-[300px] truncate">
                              {post.caption.length > 70
                                ? `${post.caption.slice(0, 70)}...`
                                : post.caption}
                            </TableCell>
                            <TableCell>
                              <Badge>{post.leadMagnetKeyword}</Badge>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns">
            <Card>
              <CardHeader>
                <CardTitle>Content Patterns</CardTitle>
                <CardDescription>
                  Posting patterns and strategy insights for @
                  {competitor.handle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Post Type Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(["reel", "carousel", "image"] as const).map(
                          (type) => {
                            const count = competitorPosts.filter(
                              (p) => p.postType === type,
                            ).length;
                            const pct =
                              competitorPosts.length > 0
                                ? Math.round(
                                    (count / competitorPosts.length) * 100,
                                  )
                                : 0;
                            return (
                              <div
                                key={type}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm capitalize">
                                  {type}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {count} posts ({pct}%)
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Hook Style Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(
                          [
                            "question",
                            "bold_claim",
                            "story",
                            "statistic",
                            "curiosity_gap",
                            "listicle",
                          ] as const
                        ).map((style) => {
                          const count = competitorPosts.filter(
                            (p) => p.hookStyle === style,
                          ).length;
                          return count > 0 ? (
                            <div
                              key={style}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">
                                {style.replace(/_/g, " ")}
                              </span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground">
                  @{competitor.handle} primarily uses{" "}
                  {competitorPosts.filter((p) => p.postType === "reel").length >
                  competitorPosts.filter((p) => p.postType === "carousel")
                    .length
                    ? "reels"
                    : "carousels"}{" "}
                  as their main content format. Their CTA strategy revolves
                  around the "{competitor.topKeyword}" keyword with a{" "}
                  {(competitor.leadMagnetHitRate * 100).toFixed(1)}% lead magnet
                  hit rate, indicating an established comment-to-DM funnel.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
