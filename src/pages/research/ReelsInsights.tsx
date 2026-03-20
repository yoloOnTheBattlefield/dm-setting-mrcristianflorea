import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthlyReels, ReelComment } from "@/hooks/useMonthlyReels";
import { useMonthlyPosts, PostItem } from "@/hooks/useMonthlyPosts";
import { useInstagramStories } from "@/hooks/useInstagramStories";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  RefreshCw, ExternalLink, Clapperboard, AlertCircle, Heart,
  MessageCircle, Play, ChevronDown, ChevronUp, Image, BookImage, Clock,
} from "lucide-react";
import { format } from "date-fns";

function CommentList({ comments }: { comments: ReelComment[] }) {
  return (
    <div className="pl-7 mt-2 space-y-2 border-l-2 border-border ml-7">
      {comments.map((c) => (
        <div key={c.id} className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">@{c.username}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(c.timestamp), "MMM d · h:mm a")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <AlertCircle className="h-4 w-4 text-destructive" />
      {message}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="sm:col-span-1 animate-pulse">
        <CardHeader>
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded mt-1" />
        </CardHeader>
      </Card>
      <Card className="sm:col-span-2 animate-pulse">
        <CardContent className="pt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReelsInsights() {
  const { user } = useAuth();
  const accountId = user?.account_id;
  const queryClient = useQueryClient();

  const reels = useMonthlyReels(accountId);
  const posts = useMonthlyPosts(accountId);
  const stories = useInstagramStories(accountId);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  function toggleComments(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function igErrorMessage(err: unknown) {
    const msg = (err as Error).message;
    return msg.includes("400")
      ? "Instagram is not connected to this account. Connect it in Integrations."
      : "Failed to load data.";
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clapperboard className="h-6 w-6" />
            Instagram Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reels.data?.ig_username ? `@${reels.data.ig_username} · ` : ""}
            Reels, posts, and stories from your account
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["monthly-reels", accountId] });
            queryClient.invalidateQueries({ queryKey: ["monthly-posts", accountId] });
            queryClient.invalidateQueries({ queryKey: ["instagram-stories", accountId] });
          }}
          disabled={reels.isLoading || posts.isLoading || stories.isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${reels.isLoading || posts.isLoading || stories.isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs defaultValue="reels">
        <TabsList>
          <TabsTrigger value="reels" className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" /> Reels
            {reels.data && <Badge variant="secondary" className="ml-1 text-xs">{reels.data.count}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5" /> Posts
            {posts.data && <Badge variant="secondary" className="ml-1 text-xs">{posts.data.count}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Stories
            {stories.data && <Badge variant="secondary" className="ml-1 text-xs">{stories.data.count}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── Reels ── */}
        <TabsContent value="reels" className="mt-4">
          {reels.error ? (
            <ErrorState message={igErrorMessage(reels.error)} />
          ) : reels.isLoading ? (
            <LoadingSkeleton />
          ) : reels.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-5xl font-bold tabular-nums">{reels.data.count}</CardTitle>
                  <CardDescription>Reel{reels.data.count !== 1 ? "s" : ""} in {reels.data.month}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={reels.data.count > 0 ? "default" : "secondary"}>
                    {reels.data.count > 0 ? "Active" : "None yet"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader><CardTitle className="text-base">Reels</CardTitle></CardHeader>
                <CardContent>
                  {reels.data.reels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reels posted this month yet.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {reels.data.reels.map((reel, i) => {
                        const expanded = expandedItems.has(reel.id);
                        return (
                          <div key={reel.id} className="py-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                                <span className="text-sm">{format(new Date(reel.timestamp), "MMM d, yyyy · h:mm a")}</span>
                              </div>
                              <a href={reel.permalink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div className="flex items-center gap-4 pl-7">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Play className="h-3 w-3" /> {(reel.play_count ?? 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="h-3 w-3" /> {reel.like_count.toLocaleString()}
                              </span>
                              {reel.comments?.length > 0 ? (
                                <button onClick={() => toggleComments(reel.id)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  <MessageCircle className="h-3 w-3" />
                                  {reel.comments_count.toLocaleString()}
                                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MessageCircle className="h-3 w-3" /> {reel.comments_count.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {expanded && reel.comments?.length > 0 && <CommentList comments={reel.comments} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Posts ── */}
        <TabsContent value="posts" className="mt-4">
          {posts.error ? (
            <ErrorState message={igErrorMessage(posts.error)} />
          ) : posts.isLoading ? (
            <LoadingSkeleton />
          ) : posts.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-5xl font-bold tabular-nums">{posts.data.count}</CardTitle>
                  <CardDescription>Post{posts.data.count !== 1 ? "s" : ""} in {posts.data.month}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={posts.data.count > 0 ? "default" : "secondary"}>
                    {posts.data.count > 0 ? "Active" : "None yet"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader><CardTitle className="text-base">Posts</CardTitle></CardHeader>
                <CardContent>
                  {posts.data.posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts this month yet.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {posts.data.posts.map((post, i) => {
                        const expanded = expandedItems.has(post.id);
                        return (
                          <div key={post.id} className="py-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                                <span className="text-xs text-muted-foreground">
                                  {post.media_type === "CAROUSEL_ALBUM" ? <BookImage className="h-3 w-3 inline mr-1" /> : <Image className="h-3 w-3 inline mr-1" />}
                                </span>
                                <span className="text-sm">{format(new Date(post.timestamp), "MMM d, yyyy · h:mm a")}</span>
                              </div>
                              <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {post.caption && (
                              <p className="text-xs text-muted-foreground pl-7 line-clamp-2">{post.caption}</p>
                            )}
                            <div className="flex items-center gap-4 pl-7">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="h-3 w-3" /> {post.like_count.toLocaleString()}
                              </span>
                              {post.comments?.length > 0 ? (
                                <button onClick={() => toggleComments(post.id)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  <MessageCircle className="h-3 w-3" />
                                  {post.comments_count.toLocaleString()}
                                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MessageCircle className="h-3 w-3" /> {post.comments_count.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {expanded && post.comments?.length > 0 && <CommentList comments={post.comments} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Stories ── */}
        <TabsContent value="stories" className="mt-4">
          {stories.error ? (
            <ErrorState message={igErrorMessage(stories.error)} />
          ) : stories.isLoading ? (
            <LoadingSkeleton />
          ) : stories.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-5xl font-bold tabular-nums">{stories.data.count}</CardTitle>
                  <CardDescription>Active stor{stories.data.count !== 1 ? "ies" : "y"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={stories.data.count > 0 ? "default" : "secondary"}>
                    {stories.data.count > 0 ? "Live now" : "No active stories"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader><CardTitle className="text-base">Stories</CardTitle></CardHeader>
                <CardContent>
                  {stories.data.stories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active stories right now.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {stories.data.stories.map((story, i) => (
                        <div key={story.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">{story.media_type}</span>
                            <span className="text-sm">{format(new Date(story.timestamp), "MMM d · h:mm a")}</span>
                          </div>
                          {story.permalink && (
                            <a href={story.permalink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
