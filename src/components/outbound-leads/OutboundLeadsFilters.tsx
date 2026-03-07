import React from "react";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OutboundLeadsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  qualifiedFilter: string;
  setQualifiedFilter: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  sourceOptions: string[];
  promptFilter: string;
  setPromptFilter: (value: string) => void;
  promptOptions: { _id: string; label: string }[];
  messagedFilter: string;
  setMessagedFilter: React.Dispatch<React.SetStateAction<string>>;
  repliedFilter: string;
  setRepliedFilter: React.Dispatch<React.SetStateAction<string>>;
  bookedFilter: string;
  setBookedFilter: React.Dispatch<React.SetStateAction<string>>;
  onNavigateImport: () => void;
}

export default function OutboundLeadsFilters({
  searchQuery,
  setSearchQuery,
  qualifiedFilter,
  setQualifiedFilter,
  source,
  setSource,
  sourceOptions,
  promptFilter,
  setPromptFilter,
  promptOptions,
  messagedFilter,
  setMessagedFilter,
  repliedFilter,
  setRepliedFilter,
  bookedFilter,
  setBookedFilter,
  onNavigateImport,
}: OutboundLeadsFiltersProps) {
  return (
    <>
      {/* ── Mobile sticky header ── */}
      <div className="md:hidden sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-4 py-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          {/* Quick pill filters */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRepliedFilter((v) => v === "true" ? "all" : "true")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${repliedFilter === "true" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-foreground/30"}`}
            >
              Replied
            </button>
            <button
              type="button"
              onClick={() => setBookedFilter((v) => v === "true" ? "all" : "true")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${bookedFilter === "true" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-foreground/30"}`}
            >
              Converted
            </button>
            <button
              type="button"
              onClick={() => setMessagedFilter((v) => v === "true" ? "all" : "true")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${messagedFilter === "true" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-foreground/30"}`}
            >
              Messaged
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop sticky header ── */}
      <div className="hidden md:block sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 space-y-3">
          {/* Row 1: Title + Import */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Outbound Leads
              </h2>
              <p className="text-muted-foreground">
                IG profiles from scraper uploads
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateImport}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import XLSX
            </Button>
          </div>

          {/* Row 2: Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto_minmax(200px,1.5fr)] gap-3">
            {/* Lead Quality filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Lead Quality</Label>
              <Select value={qualifiedFilter} onValueChange={setQualifiedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualified Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Qualified Only</SelectItem>
                  <SelectItem value="false">Unqualified Only</SelectItem>
                  <SelectItem value="all">All Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      @{s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Prompt</Label>
              <Select value={promptFilter} onValueChange={setPromptFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prompts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prompts</SelectItem>
                  {promptOptions.map((p) => (
                    <SelectItem key={p._id} value={p.label}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messaged filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Messaged</Label>
              <Select value={messagedFilter} onValueChange={setMessagedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Replied filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Replied</Label>
              <Select value={repliedFilter} onValueChange={setRepliedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Converted filter */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Converted</Label>
              <Select value={bookedFilter} onValueChange={setBookedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
