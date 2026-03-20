import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthlyReels } from "@/hooks/useMonthlyReels";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Clapperboard, AlertCircle, Heart, MessageCircle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function ReelsInsights() {
  const { user } = useAuth();
  const accountId = user?.account_id;
  const { data, isLoading, error } = useMonthlyReels(accountId);
  const queryClient = useQueryClient();
  const [expandedReels, setExpandedReels] = useState<Set<string>>(new Set());

  function toggleComments(reelId: string) {
    setExpandedReels((prev) => {
      const next = new Set(prev);
      next.has(reelId) ? next.delete(reelId) : next.add(reelId);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clapperboard className="h-6 w-6" />
            Reels This Month
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data
              ? `${data.month}${data.ig_username ? ` · @${data.ig_username}` : ""}`
              : "Instagram Reels posted since the start of the month"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["monthly-reels", accountId] })}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-destructive" />
          {(error as Error).message.includes("400")
            ? "Instagram is not connected to this account. Connect it in Integrations."
            : "Failed to load reels data."}
        </div>
      ) : isLoading ? (
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
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Count card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-5xl font-bold tabular-nums">{data.count}</CardTitle>
              <CardDescription>
                Reel{data.count !== 1 ? "s" : ""} posted in {data.month}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={data.count > 0 ? "default" : "secondary"}>
                {data.count > 0 ? "Active" : "None yet"}
              </Badge>
            </CardContent>
          </Card>

          {/* Reels list */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {data.reels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reels posted this month yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.reels.map((reel, i) => {
                    const expanded = expandedReels.has(reel.id);
                    return (
                      <div key={reel.id} className="py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                            <span className="text-sm">{format(new Date(reel.timestamp), "MMM d, yyyy · h:mm a")}</span>
                          </div>
                          <a
                            href={reel.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-4 pl-7">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Play className="h-3 w-3" /> {reel.play_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" /> {reel.like_count.toLocaleString()}
                          </span>
                          {reel.comments?.length > 0 ? (
                            <button
                              onClick={() => toggleComments(reel.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
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
                        {expanded && reel.comments?.length > 0 && (
                          <div className="pl-7 mt-2 space-y-2 border-l-2 border-border ml-7">
                            {reel.comments.map((c) => (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
