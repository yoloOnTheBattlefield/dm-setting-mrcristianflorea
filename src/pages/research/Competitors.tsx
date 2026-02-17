import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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

import { useResearchCompetitors } from "@/hooks/useResearchCompetitors";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function Competitors() {
  const navigate = useNavigate();
  const { data: competitors, isLoading } = useResearchCompetitors();

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Sticky header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold tracking-tight">Competitors</h2>
          <p className="text-muted-foreground">
            Track and analyze competitor accounts
          </p>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tracked Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Handle</TableHead>
                    <TableHead className="text-right">Followers</TableHead>
                    <TableHead className="text-right">Posts Tracked</TableHead>
                    <TableHead className="text-right">Avg Comments</TableHead>
                    <TableHead className="text-right">
                      Lead Magnet Rate
                    </TableHead>
                    <TableHead>Top Keyword</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Post</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors?.map((comp) => (
                    <TableRow
                      key={comp.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/research/competitors/${comp.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        @{comp.handle}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFollowers(comp.followers)}
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.postsTracked}
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.avgComments}
                      </TableCell>
                      <TableCell className="text-right">
                        {(comp.leadMagnetHitRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{comp.topKeyword}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[comp.trackingStatus] ?? ""}
                        >
                          {comp.trackingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(comp.lastPost), "MMM d, yyyy")}
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
