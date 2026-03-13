import { useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useResearchPosts } from "@/hooks/useResearchPosts";
import { useResearchCompetitors } from "@/hooks/useResearchCompetitors";
import type { PostSortBy } from "@/lib/research-types";

const ALL_VALUE = "__all__";

export default function PostsLibrary() {
  const [competitorId, setCompetitorId] = useState<string>("");
  const [postType, setPostType] = useState<string>("");
  const [topicTag, setTopicTag] = useState<string>("");
  const [hookStyle, setHookStyle] = useState<string>("");
  const [ctaType, setCtaType] = useState<string>("");
  const [hasLeadMagnet, setHasLeadMagnet] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<PostSortBy>("newest");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: competitors } = useResearchCompetitors();

  const { data, isLoading } = useResearchPosts({
    competitorId: competitorId || undefined,
    postType: postType || undefined,
    topicTag: topicTag || undefined,
    hookStyle: hookStyle || undefined,
    ctaType: ctaType || undefined,
    hasLeadMagnet:
      hasLeadMagnet === "true"
        ? true
        : hasLeadMagnet === "false"
          ? false
          : undefined,
    search: search || undefined,
    sortBy,
    page,
    limit,
  });

  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function resetFilters() {
    setCompetitorId("");
    setPostType("");
    setTopicTag("");
    setHookStyle("");
    setCtaType("");
    setHasLeadMagnet("");
    setSearch("");
    setSortBy("newest");
    setPage(1);
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 p-6 space-y-6">
        {/* Filter Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Competitor */}
              <Select
                value={competitorId || ALL_VALUE}
                onValueChange={(v) => {
                  setCompetitorId(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Competitor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Competitors</SelectItem>
                  {competitors?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      @{c.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Post Type */}
              <Select
                value={postType || ALL_VALUE}
                onValueChange={(v) => {
                  setPostType(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Types</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>

              {/* Topic Tag */}
              <Select
                value={topicTag || ALL_VALUE}
                onValueChange={(v) => {
                  setTopicTag(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Topics</SelectItem>
                  {[
                    "sales",
                    "mindset",
                    "how-to",
                    "social-proof",
                    "controversy",
                    "behind-the-scenes",
                    "lifestyle",
                    "tutorial",
                    "case-study",
                    "motivation",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Hook Style */}
              <Select
                value={hookStyle || ALL_VALUE}
                onValueChange={(v) => {
                  setHookStyle(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hook Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Hooks</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="bold_claim">Bold Claim</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="statistic">Statistic</SelectItem>
                  <SelectItem value="curiosity_gap">Curiosity Gap</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                </SelectContent>
              </Select>

              {/* CTA Type */}
              <Select
                value={ctaType || ALL_VALUE}
                onValueChange={(v) => {
                  setCtaType(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="CTA Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All CTAs</SelectItem>
                  <SelectItem value="comment_keyword">
                    Comment Keyword
                  </SelectItem>
                  <SelectItem value="link_in_bio">Link in Bio</SelectItem>
                  <SelectItem value="dm_me">DM Me</SelectItem>
                  <SelectItem value="save_this">Save This</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>

              {/* Has Lead Magnet */}
              <Select
                value={hasLeadMagnet || ALL_VALUE}
                onValueChange={(v) => {
                  setHasLeadMagnet(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lead Magnet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Any</SelectItem>
                  <SelectItem value="true">Has Lead Magnet</SelectItem>
                  <SelectItem value="false">No Lead Magnet</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v as PostSortBy);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="comments">Most Comments</SelectItem>
                  <SelectItem value="keyword_repetition">
                    Keyword Repetition
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative col-span-2 md:col-span-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search captions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>

              {/* Reset */}
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results</span>
              <span className="text-sm font-normal text-muted-foreground">
                {total} posts found
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No posts match your filters. Try adjusting your criteria.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
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
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          @{post.competitorHandle}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {post.caption.length > 60
                            ? `${post.caption.slice(0, 60)}...`
                            : post.caption}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{post.postType}</Badge>
                        </TableCell>
                        <TableCell>
                          {post.hookStyle ? (
                            <Badge variant="outline">
                              {post.hookStyle.replace(/_/g, " ")}
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {post.ctaType ? (
                            <Badge variant="outline">
                              {post.ctaType.replace(/_/g, " ")}
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.commentsCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.likesCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(post.postedAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
