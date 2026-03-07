import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import type { TargetStat } from "./types";

interface TargetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: TargetStat[];
  targetSearch: string;
  setTargetSearch: (search: string) => void;
  targetSort: "best_qual" | "most_scraped" | "alpha";
  setTargetSort: (sort: "best_qual" | "most_scraped" | "alpha") => void;
  selectedTargets: Set<string>;
  setSelectedTargets: React.Dispatch<React.SetStateAction<Set<string>>>;
  parsedSeeds: string[];
  seedText: string;
  setSeedText: (text: string) => void;
}

export function TargetPickerDialog({
  open,
  onOpenChange,
  targets,
  targetSearch,
  setTargetSearch,
  targetSort,
  setTargetSort,
  selectedTargets,
  setSelectedTargets,
  parsedSeeds,
  seedText,
  setSeedText,
}: TargetPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pick from previous targets</DialogTitle>
          <DialogDescription>
            Performance based on previous Deep Scrape jobs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 items-end">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search targets..."
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={targetSort} onValueChange={(v) => setTargetSort(v as "best_qual" | "most_scraped" | "alpha")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_qual">Best Qual %</SelectItem>
              <SelectItem value="most_scraped">Most Scraped</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-xs">Target</TableHead>
                <TableHead className="text-xs text-right">Scraped</TableHead>
                <TableHead className="text-xs text-right">Qualified</TableHead>
                <TableHead className="text-xs text-right">Qual %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const filtered = targets
                  .filter((t) => t.seed.toLowerCase().includes(targetSearch.toLowerCase()))
                  .map((t) => {
                    const total = t.qualified + t.rejected;
                    const qualRate = total > 0 ? +((t.qualified / total) * 100).toFixed(1) : null;
                    return { ...t, qualRate };
                  })
                  .sort((a, b) => {
                    if (targetSort === "best_qual") return (b.qualRate ?? -1) - (a.qualRate ?? -1);
                    if (targetSort === "most_scraped") return b.total_scraped - a.total_scraped;
                    return a.seed.localeCompare(b.seed);
                  });

                if (filtered.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        No targets found.
                      </TableCell>
                    </TableRow>
                  );
                }

                return filtered.map((t) => {
                  const isLowFit = (t.qualified + t.rejected) >= 10 && t.qualRate !== null && t.qualRate < 20;
                  return (
                    <TableRow
                      key={t.seed}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedTargets((prev) => {
                          const next = new Set(prev);
                          if (next.has(t.seed)) next.delete(t.seed);
                          else next.add(t.seed);
                          return next;
                        });
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedTargets.has(t.seed)}
                          onCheckedChange={() => {
                            setSelectedTargets((prev) => {
                              const next = new Set(prev);
                              if (next.has(t.seed)) next.delete(t.seed);
                              else next.add(t.seed);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          @{t.seed}
                          {isLowFit && (
                            <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">
                              Low Fit
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {t.total_scraped.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-right text-green-500">
                        {t.qualified}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {t.qualRate !== null ? (
                          <span className={t.qualRate >= 50 ? "text-green-500" : t.qualRate >= 20 ? "text-yellow-500" : "text-red-500"}>
                            {t.qualRate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{"\u2014"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </div>
        {selectedTargets.size > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedTargets.size} target{selectedTargets.size !== 1 ? "s" : ""} selected
            {(() => {
              const selected = targets.filter((t) => selectedTargets.has(t.seed));
              const totalEvaluated = selected.reduce((s, t) => s + t.qualified + t.rejected, 0);
              const totalQualified = selected.reduce((s, t) => s + t.qualified, 0);
              const avgQual = totalEvaluated > 0 ? +((totalQualified / totalEvaluated) * 100).toFixed(0) : null;
              return avgQual !== null ? ` \u00b7 Avg Qual %: ${avgQual}%` : "";
            })()}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selectedTargets.size === 0}
            onClick={() => {
              const existing = new Set(parsedSeeds);
              const toAdd = Array.from(selectedTargets).filter((s) => !existing.has(s));
              if (toAdd.length > 0) {
                const current = seedText.trim();
                setSeedText(current ? `${current}\n${toAdd.join("\n")}` : toAdd.join("\n"));
              }
              onOpenChange(false);
            }}
          >
            Add selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
