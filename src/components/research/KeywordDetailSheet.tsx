import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, MessageSquareQuote, Lightbulb, Megaphone } from "lucide-react";
import type { KeywordDetailData } from "@/lib/research-types";
import { format } from "date-fns";

interface KeywordDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KeywordDetailData | null | undefined;
  isLoading: boolean;
}

const trendConfig = {
  rising: { icon: TrendingUp, label: "Rising", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  flat: { icon: Minus, label: "Flat", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  falling: { icon: TrendingDown, label: "Falling", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function KeywordDetailSheet({ open, onOpenChange, data, isLoading }: KeywordDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        {isLoading ? (
          <div className="space-y-6 pt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="text-xl">{data.keyword.keyword}</span>
                {(() => {
                  const trend = trendConfig[data.keyword.trend];
                  const TrendIcon = trend.icon;
                  return (
                    <Badge variant="outline" className={trend.className}>
                      <TrendIcon className="h-3 w-3 mr-1" />
                      {trend.label}
                    </Badge>
                  );
                })()}
              </SheetTitle>
              <SheetDescription>
                {data.keyword.totalMentions} mentions across {data.keyword.postsUsingIt} posts by {data.keyword.competitorsUsingIt} competitors
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{data.keyword.totalMentions}</p>
                  <p className="text-xs text-muted-foreground">Total Mentions</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{data.keyword.postsUsingIt}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{data.keyword.competitorsUsingIt}</p>
                  <p className="text-xs text-muted-foreground">Competitors</p>
                </div>
              </div>

              {/* Driving posts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Posts Driving This Keyword</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Caption</TableHead>
                        <TableHead className="text-right">Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.drivingPosts.slice(0, 5).map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium text-xs">@{post.competitorHandle}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{post.caption}</TableCell>
                          <TableCell className="text-right text-xs">{post.commentsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Exact phrases */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4" />
                    Exact Comment Phrases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.exactPhrases.map((phrase, i) => (
                      <div key={i} className="rounded-md bg-muted px-3 py-2 text-sm italic">
                        &ldquo;{phrase}&rdquo;
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead magnet guess */}
              {data.leadMagnetGuess && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                      Lead Magnet Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{data.leadMagnetGuess}</p>
                  </CardContent>
                </Card>
              )}

              {/* Suggestion */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    Suggestion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.suggestion}</p>
                </CardContent>
              </Card>

              {/* Competitors using this keyword */}
              <div>
                <p className="text-sm font-medium mb-2">Competitors Using This Keyword</p>
                <div className="flex flex-wrap gap-2">
                  {data.keyword.competitorHandles.map((handle) => (
                    <Badge key={handle} variant="secondary">@{handle}</Badge>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium mb-1">Timeline</p>
                <p className="text-xs text-muted-foreground">
                  First seen: {format(new Date(data.keyword.firstSeen), "MMM d, yyyy")} &middot; Last seen: {format(new Date(data.keyword.lastSeen), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Keyword not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
