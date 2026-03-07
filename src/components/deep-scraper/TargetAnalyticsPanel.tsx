import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  BarChart3,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { TargetStatWithQual } from "./types";

function SortHeader({ col, label, sortCol, sortAsc, onSort, className }: { col: string; label: string; sortCol: string; sortAsc: boolean; onSort: (col: string) => void; className?: string }) {
  return (
    <button onClick={() => onSort(col)} className={`flex items-center gap-1 hover:text-foreground transition-colors ${className || ""}`}>
      {label}
      {sortCol === col ? (sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

interface TargetAnalyticsPanelProps {
  targets: { seed: string; total_scraped: number; avg_followers: number; qualified: number; rejected: number; messaged: number; replied: number; reply_rate: number; booked: number; book_rate: number; total_contract_value: number }[];
  showTargetStats: boolean;
  setShowTargetStats: (show: boolean) => void;
  taSearch: string;
  setTaSearch: (search: string) => void;
  taSortCol: string;
  taSortAsc: boolean;
  handleTaSort: (col: string) => void;
  taLowFitFilter: "all" | "hide_low" | "only_low";
  setTaLowFitFilter: (filter: "all" | "hide_low" | "only_low") => void;
  taVisibleCols: Set<string>;
  toggleTaCol: (col: string) => void;
  filteredTargets: TargetStatWithQual[];
}

export function TargetAnalyticsPanel({
  targets,
  showTargetStats,
  setShowTargetStats,
  taSearch,
  setTaSearch,
  taSortCol,
  taSortAsc,
  handleTaSort,
  taLowFitFilter,
  setTaLowFitFilter,
  taVisibleCols,
  toggleTaCol,
  filteredTargets,
}: TargetAnalyticsPanelProps) {
  if (targets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold">Target Analytics</h3>
          <Badge variant="secondary" className="text-xs font-normal">{targets.length} targets</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowTargetStats(!showTargetStats)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${showTargetStats ? "rotate-180" : ""}`} />
        </Button>
      </div>
      {showTargetStats && (
        <div className="rounded-lg border bg-card">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search targets..."
                value={taSearch}
                onChange={(e) => setTaSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={taLowFitFilter} onValueChange={(v: string) => setTaLowFitFilter(v as "all" | "hide_low" | "only_low")}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="hide_low">Hide Low Fit</SelectItem>
                <SelectItem value="only_low">Only Low Fit</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { key: "scraped", label: "Scraped" },
                  { key: "avg_followers", label: "Avg Followers" },
                  { key: "qualified", label: "Qualified" },
                  { key: "qual_pct", label: "Qual %" },
                  { key: "messaged", label: "Messaged" },
                  { key: "replied", label: "Replied" },
                  { key: "reply_pct", label: "Reply %" },
                  { key: "booked", label: "Booked" },
                  { key: "book_pct", label: "Book %" },
                  { key: "revenue", label: "Revenue" },
                ].map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={taVisibleCols.has(col.key)}
                    onCheckedChange={() => toggleTaCol(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <SortHeader col="seed" label="Target" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} />
                </TableHead>
                {taVisibleCols.has("scraped") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="scraped" label="Scraped" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("avg_followers") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="avg_followers" label="Avg Followers" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("qualified") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="qualified" label="Qualified" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("qual_pct") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="qual_pct" label="Qual %" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("messaged") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="messaged" label="Messaged" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("replied") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="replied" label="Replied" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("reply_pct") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="reply_pct" label="Reply %" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("booked") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="booked" label="Booked" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("book_pct") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="book_pct" label="Book %" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
                {taVisibleCols.has("revenue") && (
                  <TableHead className="text-xs text-right">
                    <SortHeader col="revenue" label="Revenue" sortCol={taSortCol} sortAsc={taSortAsc} onSort={handleTaSort} className="ml-auto" />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTargets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-20 text-center text-muted-foreground">
                    No targets match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTargets.map((t) => (
                  <TableRow key={t.seed} className={t.isLowFit ? "border-l-2 border-l-orange-500" : ""}>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        @{t.seed}
                        {t.isLowFit && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0 cursor-help">
                                  Low Fit
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[220px]">
                                <p className="text-xs">This target has a low qualification rate relative to total scraped profiles.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    {taVisibleCols.has("scraped") && (
                      <TableCell className="text-xs text-right">{t.total_scraped.toLocaleString()}</TableCell>
                    )}
                    {taVisibleCols.has("avg_followers") && (
                      <TableCell className="text-xs text-right text-muted-foreground">{t.avg_followers.toLocaleString()}</TableCell>
                    )}
                    {taVisibleCols.has("qualified") && (
                      <TableCell className="text-xs text-right text-green-500">{t.qualified}</TableCell>
                    )}
                    {taVisibleCols.has("qual_pct") && (
                      <TableCell className="text-xs text-right">
                        {t.qualRate !== null ? (
                          <span className={t.qualRate >= 50 ? "text-green-500" : t.qualRate >= 25 ? "text-yellow-500" : "text-red-500"}>
                            {t.qualRate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                    )}
                    {taVisibleCols.has("messaged") && (
                      <TableCell className="text-xs text-right">{t.messaged}</TableCell>
                    )}
                    {taVisibleCols.has("replied") && (
                      <TableCell className="text-xs text-right">{t.replied}</TableCell>
                    )}
                    {taVisibleCols.has("reply_pct") && (
                      <TableCell className="text-xs text-right">
                        {t.reply_rate > 0 ? (
                          <span className={t.reply_rate >= 10 ? "text-green-500" : t.reply_rate >= 5 ? "text-yellow-500" : "text-red-500"}>
                            {t.reply_rate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                    )}
                    {taVisibleCols.has("booked") && (
                      <TableCell className="text-xs text-right">{t.booked}</TableCell>
                    )}
                    {taVisibleCols.has("book_pct") && (
                      <TableCell className="text-xs text-right">
                        {t.book_rate > 0 ? (
                          <span className={t.book_rate >= 5 ? "text-green-500" : t.book_rate >= 2 ? "text-yellow-500" : "text-red-500"}>
                            {t.book_rate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                    )}
                    {taVisibleCols.has("revenue") && (
                      <TableCell className="text-xs text-right">
                        {t.total_contract_value > 0 ? (
                          <span className="text-green-500">${t.total_contract_value.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
