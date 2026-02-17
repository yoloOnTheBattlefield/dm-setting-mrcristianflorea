import { useState, useMemo } from "react";
import { useResearchIdeas } from "@/hooks/useResearchIdeas";
import type { IdeaCategory } from "@/lib/research-types";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORY_OPTIONS: { value: IdeaCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "hooks", label: "Hooks" },
  { value: "lead_magnets", label: "Lead Magnets" },
  { value: "angles", label: "Angles" },
  { value: "caption_structures", label: "Caption Structures" },
  { value: "cta_scripts", label: "CTA Scripts" },
  { value: "comment_topics", label: "Comment Topics" },
];

const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  hooks: "bg-blue-500/15 text-blue-700 border-blue-500/20 hover:bg-blue-500/15",
  lead_magnets: "bg-purple-500/15 text-purple-700 border-purple-500/20 hover:bg-purple-500/15",
  angles: "bg-orange-500/15 text-orange-700 border-orange-500/20 hover:bg-orange-500/15",
  caption_structures: "bg-teal-500/15 text-teal-700 border-teal-500/20 hover:bg-teal-500/15",
  cta_scripts: "bg-pink-500/15 text-pink-700 border-pink-500/20 hover:bg-pink-500/15",
  comment_topics: "bg-amber-500/15 text-amber-700 border-amber-500/20 hover:bg-amber-500/15",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-500/15 text-gray-600 border-gray-500/20 hover:bg-gray-500/15",
  filmed: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/15",
  posted: "bg-green-500/15 text-green-700 border-green-500/20 hover:bg-green-500/15",
};

function formatCategoryLabel(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function IdeasBank() {
  const { data: ideas, isLoading } = useResearchIdeas();

  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!ideas) return [];
    return ideas.filter((idea) => {
      if (categoryFilter !== "all" && idea.category !== categoryFilter) return false;
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;
      return true;
    });
  }, [ideas, categoryFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-16 z-50 bg-background border-b border-border">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h2 className="text-2xl font-bold tracking-tight">Ideas Bank</h2>
          <p className="text-muted-foreground">
            Save and organize content ideas from research
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as IdeaCategory | "all")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="filmed">Filmed</TabsTrigger>
              <TabsTrigger value="posted">Posted</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Ideas table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="max-w-[200px]">Why It Worked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-w-[200px]">Suggested Rewrite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium">{idea.title}</TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[idea.category]}>
                        {formatCategoryLabel(idea.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{idea.sourceCompetitorHandle}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={idea.whyItWorked}>
                      {idea.whyItWorked}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[idea.status]}>
                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={idea.suggestedRewrite}>
                      {idea.suggestedRewrite}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No ideas match the current filters.
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
