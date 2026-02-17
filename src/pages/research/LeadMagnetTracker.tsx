import { useMemo } from "react";
import { format } from "date-fns";
import { useResearchLeadMagnets } from "@/hooks/useResearchLeadMagnets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Magnet, Repeat, TrendingUp } from "lucide-react";

export default function LeadMagnetTracker() {
  const { data: leadMagnets, isLoading } = useResearchLeadMagnets();

  const sorted = useMemo(() => {
    if (!leadMagnets) return [];
    return [...leadMagnets].sort(
      (a, b) => b.keywordRepetitionRate - a.keywordRepetitionRate,
    );
  }, [leadMagnets]);

  const activeCount = useMemo(
    () => sorted.filter((lm) => lm.isActive).length,
    [sorted],
  );

  const avgRepetitionRate = useMemo(() => {
    if (sorted.length === 0) return 0;
    const sum = sorted.reduce((acc, lm) => acc + lm.keywordRepetitionRate, 0);
    return (sum / sorted.length).toFixed(1);
  }, [sorted]);

  const topKeyword = useMemo(() => {
    if (sorted.length === 0) return "—";
    return sorted[0].keyword;
  }, [sorted]);

  const offerTypeLabel = (type: string) =>
    type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Lead Magnet Tracker
          </h2>
          <p className="text-muted-foreground">
            Track competitor lead magnets and keyword funnels
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Lead Magnets
              </CardTitle>
              <Magnet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Keyword Repetition Rate
              </CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRepetitionRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Performing Keyword
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topKeyword}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Offer Type</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="text-right">Posts Using</TableHead>
                  <TableHead className="text-right">Avg Comments</TableHead>
                  <TableHead className="text-right">Repetition Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lm) => (
                  <TableRow key={lm.id}>
                    <TableCell className="font-medium">{lm.brand}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lm.keyword}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {offerTypeLabel(lm.offerType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {lm.topic}
                    </TableCell>
                    <TableCell className="text-right">
                      {lm.postsUsing}
                    </TableCell>
                    <TableCell className="text-right">
                      {lm.avgCommentsPerPost}
                    </TableCell>
                    <TableCell className="text-right">
                      {lm.keywordRepetitionRate}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          lm.isActive
                            ? "bg-green-500/15 text-green-700 border-green-500/20 hover:bg-green-500/15"
                            : "bg-gray-500/15 text-gray-500 border-gray-500/20 hover:bg-gray-500/15"
                        }
                      >
                        {lm.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(lm.dateDetected), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No lead magnets tracked yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
