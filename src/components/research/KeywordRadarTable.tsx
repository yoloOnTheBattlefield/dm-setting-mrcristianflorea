import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import type { ResearchKeyword } from "@/lib/research-types";

type SortField = "keyword" | "totalMentions" | "postsUsingIt" | "competitorsUsingIt" | "trend";
type SortDir = "asc" | "desc";

interface KeywordRadarTableProps {
  keywords: ResearchKeyword[];
  isLoading: boolean;
  onKeywordClick: (keywordId: string) => void;
}

const trendConfig = {
  rising: { icon: TrendingUp, label: "Rising", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  flat: { icon: Minus, label: "Flat", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  falling: { icon: TrendingDown, label: "Falling", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function KeywordRadarTable({ keywords, isLoading, onKeywordClick }: KeywordRadarTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalMentions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...keywords];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((k) => k.keyword.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "keyword":
          cmp = a.keyword.localeCompare(b.keyword);
          break;
        case "totalMentions":
          cmp = a.totalMentions - b.totalMentions;
          break;
        case "postsUsingIt":
          cmp = a.postsUsingIt - b.postsUsingIt;
          break;
        case "competitorsUsingIt":
          cmp = a.competitorsUsingIt - b.competitorsUsingIt;
          break;
        case "trend": {
          const order = { rising: 3, flat: 2, falling: 1 };
          cmp = order[a.trend] - order[b.trend];
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [keywords, search, sortField, sortDir]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="keyword">Keyword</SortHeader>
              <SortHeader field="totalMentions">Mentions</SortHeader>
              <SortHeader field="postsUsingIt">Posts</SortHeader>
              <SortHeader field="competitorsUsingIt">Competitors</SortHeader>
              <SortHeader field="trend">Trend</SortHeader>
              <TableHead>Used By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No keywords found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((kw) => {
                const trend = trendConfig[kw.trend];
                const TrendIcon = trend.icon;
                return (
                  <TableRow
                    key={kw.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onKeywordClick(kw.id)}
                  >
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell>{kw.totalMentions}</TableCell>
                    <TableCell>{kw.postsUsingIt}</TableCell>
                    <TableCell>{kw.competitorsUsingIt}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={trend.className}>
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {trend.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {kw.competitorHandles.slice(0, 2).map((h) => (
                          <Badge key={h} variant="secondary" className="text-xs">
                            @{h}
                          </Badge>
                        ))}
                        {kw.competitorHandles.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{kw.competitorHandles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
