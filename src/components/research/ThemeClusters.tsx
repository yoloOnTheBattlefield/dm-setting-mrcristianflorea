import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import type { ThemeCluster } from "@/lib/research-types";

interface ThemeClustersProps {
  clusters: ThemeCluster[];
  isLoading: boolean;
}

const intentColors: Record<string, string> = {
  "purchase_intent": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  "information_seeking": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "social_proof": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  "objection": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  "engagement": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  "lead_magnet_request": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
};

function ClusterCard({ cluster }: { cluster: ThemeCluster }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = intentColors[cluster.intent] || "bg-muted text-muted-foreground";

  return (
    <Card className={`border-l-4 ${colorClass.split(" ").filter(c => c.startsWith("border-")).join(" ")}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{cluster.label}</CardTitle>
          <Badge variant="outline" className={colorClass}>
            <MessageCircle className="h-3 w-3 mr-1" />
            {cluster.totalComments}
          </Badge>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {cluster.intent.replace(/_/g, " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {cluster.exampleComments.slice(0, 3).map((comment, i) => (
            <div key={i} className="rounded-md bg-muted px-3 py-2 text-sm italic text-muted-foreground">
              &ldquo;{comment}&rdquo;
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide triggering posts
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show triggering posts ({cluster.topTriggeringPosts.length})
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-1">
            {cluster.topTriggeringPosts.map((post, i) => (
              <div key={i} className="rounded-md border p-2 text-xs">
                <p className="font-medium">@{post.competitorHandle}</p>
                <p className="text-muted-foreground truncate">{post.caption}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ThemeClusters({ clusters, isLoading }: ThemeClustersProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No theme clusters detected yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clusters.map((cluster) => (
        <ClusterCard key={cluster.id} cluster={cluster} />
      ))}
    </div>
  );
}
