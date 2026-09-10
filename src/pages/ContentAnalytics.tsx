import { useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { formatShortDate } from "@/lib/formatters";
import {
  useContentAnalytics,
  useSyncContentAnalytics,
  type ContentPost,
} from "@/hooks/useContentAnalytics";

/** Metric cells show an em dash rather than 0 when the API withheld the number. */
function metric(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

function captionPreview(post: ContentPost) {
  const text = post.caption?.replace(/\s+/g, " ").trim();
  if (!text) return post.media_product_type === "REELS" ? "Reel" : "Post";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

const WINDOWS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];

export default function ContentAnalytics() {
  const { toast } = useToast();
  const [days, setDays] = useState("90");
  const { data, isLoading } = useContentAnalytics(Number(days));
  const sync = useSyncContentAnalytics();

  const posts = data?.posts ?? [];
  const totals = data?.totals;

  async function handleSync() {
    try {
      const res = await sync.mutateAsync(Number(days));
      toast({
        title: "Refreshed",
        description: `${res.synced} post(s), ${res.with_insights} with full metrics.`,
      });
    } catch (err) {
      toast({
        title: "Could not refresh",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Analytics</h1>
          <p className="text-muted-foreground text-sm">
            How each post performed, and how many leads it actually produced.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40" aria-label="Time window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSync} disabled={sync.isPending}>
            {sync.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {totals && totals.posts > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Posts", value: totals.posts },
            { label: "Views", value: totals.views },
            { label: "Likes", value: totals.likes },
            { label: "Comments", value: totals.comments },
            { label: "Shares", value: totals.shares },
            { label: "Leads", value: totals.leads_generated },
          ].map((tile) => (
            <Card key={tile.label}>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs">{tile.label}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {tile.value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Leads are attributed to the post whose comments triggered them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : posts.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">
              <p>No posts cached yet.</p>
              <p className="mt-1">
                Hit Refresh to pull them from Instagram. Needs a Meta connection —
                Zernio doesn't expose post metrics.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Saves</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Leads / 1k views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.media_id}>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {captionPreview(post)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {post.posted_at ? formatShortDate(post.posted_at) : "—"}
                              {post.insights_error && (
                                <span className="text-amber-500"> · metrics unavailable</span>
                              )}
                            </p>
                          </div>
                          {post.permalink && (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-foreground shrink-0"
                              aria-label="Open on Instagram"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.views)}</TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.reach)}</TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.likes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.comments)}</TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.shares)}</TableCell>
                      <TableCell className="text-right tabular-nums">{metric(post.saved)}</TableCell>
                      <TableCell className="text-right">
                        {post.leads_generated > 0 ? (
                          <Badge>{post.leads_generated}</Badge>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {post.leads_per_1k_views === null ? "—" : post.leads_per_1k_views}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
