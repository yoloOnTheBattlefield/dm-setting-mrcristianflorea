import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, ExternalLink, ChevronUp, ChevronDown, Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";

const ALL_VALUE = "__all__";

type ColumnSortField = "commentsCount" | "likesCount" | "playsCount" | "viralityScore";
type SortDirection = "asc" | "desc";

function typeBadgeClass(postType: string) {
  switch (postType) {
    case "reel":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent";
    case "carousel":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100 border-transparent";
    case "image":
      return "bg-green-100 text-green-700 hover:bg-green-100 border-transparent";
    default:
      return "";
  }
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "ellipsis", total);
  } else if (current >= total - 2) {
    pages.push(1, "ellipsis", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(
      1,
      "ellipsis",
      current - 1,
      current,
      current + 1,
      "ellipsis",
      total,
    );
  }

  return pages;
}

export default function PostsLibrary() {
  const [competitorId, setCompetitorId] = useState<string>("");
  const [postType, setPostType] = useState<string>("");
  const [topicTag, setTopicTag] = useState<string>("");
  const [hookStyle, setHookStyle] = useState<string>("");
  const [ctaType, setCtaType] = useState<string>("");
  const [hasLeadMagnet, setHasLeadMagnet] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<PostSortBy>("virality");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [columnSort, setColumnSort] = useState<{
    field: ColumnSortField;
    direction: SortDirection;
  } | null>(null);

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

  const rawPosts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const posts = useMemo(() => {
    if (!columnSort) return rawPosts;
    return [...rawPosts].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[columnSort.field] as number ?? 0;
      const bVal = (b as Record<string, unknown>)[columnSort.field] as number ?? 0;
      return columnSort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [rawPosts, columnSort]);

  function toggleColumnSort(field: ColumnSortField) {
    setColumnSort((prev) => {
      if (prev?.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { field, direction: "desc" };
    });
  }

  function resetFilters() {
    setCompetitorId("");
    setPostType("");
    setTopicTag("");
    setHookStyle("");
    setCtaType("");
    setHasLeadMagnet("");
    setSearch("");
    setSortBy("virality");
    setPage(1);
    setLimit(10);
    setColumnSort(null);
  }

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 p-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>

          {/* Search — full width primary filter */}
          <div className="relative">
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

          {/* Dropdown filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Competitor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Competitor
              </label>
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
            </div>

            {/* Post Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Type
              </label>
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
            </div>

            {/* Topic Tag */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Topic
              </label>
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
            </div>

            {/* Hook Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Hook Style
              </label>
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
            </div>

            {/* CTA Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                CTA
              </label>
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
            </div>

            {/* Engagement (Lead Magnet) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Engagement
              </label>
              <Select
                value={hasLeadMagnet || ALL_VALUE}
                onValueChange={(v) => {
                  setHasLeadMagnet(v === ALL_VALUE ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Engagement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Any Engagement</SelectItem>
                  <SelectItem value="true">Has Lead Magnet</SelectItem>
                  <SelectItem value="false">No Lead Magnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Sort By
              </label>
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
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="virality">Most Viral</SelectItem>
                  <SelectItem value="keyword_repetition">
                    Keyword Repetition
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Results</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm font-normal text-muted-foreground">
                {total.toLocaleString()} posts found
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
                      <TableHead
                        className={cn(
                          "text-right cursor-pointer select-none hover:text-foreground",
                          columnSort?.field === "commentsCount" &&
                            "text-foreground font-semibold",
                        )}
                        onClick={() => toggleColumnSort("commentsCount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Comments
                          {columnSort?.field === "commentsCount" &&
                            (columnSort.direction === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className={cn(
                          "text-right cursor-pointer select-none hover:text-foreground",
                          columnSort?.field === "likesCount" &&
                            "text-foreground font-semibold",
                        )}
                        onClick={() => toggleColumnSort("likesCount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Likes
                          {columnSort?.field === "likesCount" &&
                            (columnSort.direction === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className={cn(
                          "text-right cursor-pointer select-none hover:text-foreground",
                          columnSort?.field === "playsCount" &&
                            "text-foreground font-semibold",
                        )}
                        onClick={() => toggleColumnSort("playsCount")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Plays
                          {columnSort?.field === "playsCount" &&
                            (columnSort.direction === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className={cn(
                          "text-right cursor-pointer select-none hover:text-foreground",
                          columnSort?.field === "viralityScore" &&
                            "text-foreground font-semibold",
                        )}
                        onClick={() => toggleColumnSort("viralityScore")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Virality
                          {columnSort?.field === "viralityScore" &&
                            (columnSort.direction === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="w-10">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow
                        key={post.id}
                        className="hover:bg-muted/40 cursor-pointer"
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          <a
                            href={`https://www.instagram.com/${post.competitorHandle}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{post.competitorHandle}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          {post.caption ? (
                            <span className="line-clamp-2">
                              {post.caption}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              No caption
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={typeBadgeClass(post.postType)}
                          >
                            {post.postType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.hookStyle ? (
                            <Badge variant="outline">
                              {post.hookStyle.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.ctaType ? (
                            <Badge variant="outline">
                              {post.ctaType.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.commentsCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.likesCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.playsCount != null
                            ? post.playsCount.toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.viralityScore >= 3 ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-transparent gap-1">
                              <Flame className="h-3 w-3" />
                              {post.viralityScore}×
                            </Badge>
                          ) : post.viralityScore >= 1.5 ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent">
                              {post.viralityScore}×
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {post.viralityScore}×
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(post.postedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {post.reelUrl ? (
                            <a
                              href={post.reelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rows per page
                    </span>
                    <Select
                      value={String(limit)}
                      onValueChange={(v) => {
                        setLimit(Number(v));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ml-2">
                      Page {page} of {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>

                    {pageNumbers.map((p, i) =>
                      p === "ellipsis" ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="px-2 text-sm text-muted-foreground"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          className="w-9 px-0"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ),
                    )}

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
