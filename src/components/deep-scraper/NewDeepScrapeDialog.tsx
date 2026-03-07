import React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Search,
  Clock,
} from "lucide-react";
import type { Prompt, TargetStat } from "./types";

interface NewDeepScrapeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobMode: "outbound" | "research";
  setJobMode: (mode: "outbound" | "research") => void;
  jobSource: "accounts" | "direct_urls";
  setJobSource: (source: "accounts" | "direct_urls") => void;
  jobName: string;
  setJobName: (name: string) => void;
  scrapeType: "reels" | "posts";
  setScrapeType: (type: "reels" | "posts") => void;
  scrapeComments: boolean;
  setScrapeComments: (v: boolean) => void;
  scrapeLikers: boolean;
  setScrapeLikers: (v: boolean) => void;
  scrapeFollowers: boolean;
  setScrapeFollowers: (v: boolean) => void;
  seedText: string;
  setSeedText: (text: string) => void;
  directUrlText: string;
  setDirectUrlText: (text: string) => void;
  reelLimit: number;
  setReelLimit: (limit: number) => void;
  commentLimit: number;
  setCommentLimit: (limit: number) => void;
  minFollowers: number;
  setMinFollowers: (min: number) => void;
  forceReprocess: boolean;
  setForceReprocess: (force: boolean) => void;
  scrapeEmails: boolean;
  setScrapeEmails: (scrape: boolean) => void;
  selectedPromptId: string;
  setSelectedPromptId: (id: string) => void;
  isRecurring: boolean;
  setIsRecurring: (recurring: boolean) => void;
  repeatIntervalDays: number;
  setRepeatIntervalDays: (days: number) => void;
  parsedSeeds: string[];
  parsedDirectUrls: string[];
  canStart: boolean;
  isStarting: boolean;
  onStart: () => void;
  promptsList: Prompt[];
  targets: TargetStat[];
  onOpenTargetPicker: () => void;
}

export function NewDeepScrapeDialog({
  open,
  onOpenChange,
  jobMode,
  setJobMode,
  jobSource,
  setJobSource,
  jobName,
  setJobName,
  scrapeType,
  setScrapeType,
  scrapeComments,
  setScrapeComments,
  scrapeLikers,
  setScrapeLikers,
  scrapeFollowers,
  setScrapeFollowers,
  seedText,
  setSeedText,
  directUrlText,
  setDirectUrlText,
  reelLimit,
  setReelLimit,
  commentLimit,
  setCommentLimit,
  minFollowers,
  setMinFollowers,
  forceReprocess,
  setForceReprocess,
  scrapeEmails,
  setScrapeEmails,
  selectedPromptId,
  setSelectedPromptId,
  isRecurring,
  setIsRecurring,
  repeatIntervalDays,
  setRepeatIntervalDays,
  parsedSeeds,
  parsedDirectUrls,
  canStart,
  isStarting,
  onStart,
  promptsList,
  targets,
  onOpenTargetPicker,
}: NewDeepScrapeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Deep Scrape Job</DialogTitle>
          <DialogDescription>
            {jobMode === "research"
              ? "Scrape reels or posts and comments for competitive intelligence."
              : "Scrape reels or posts, comments, and commenter profiles from seed accounts."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="jobName">Job Name</Label>
            <Input
              id="jobName"
              placeholder="e.g. Fitness niche round 1"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  jobMode === "outbound"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setJobMode("outbound")}
              >
                Outbound
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  jobMode === "research"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setJobMode("research")}
              >
                Research
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {jobMode === "outbound"
                ? "Scrape posts, comments, enrich profiles, qualify leads."
                : "Scrape posts and comments only \u2014 no profile enrichment or leads."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  jobSource === "accounts"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setJobSource("accounts")}
              >
                Accounts
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  jobSource === "direct_urls"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setJobSource("direct_urls")}
              >
                Direct URL
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {jobSource === "accounts"
                ? "Scrape reels/posts from seed accounts, then scrape comments."
                : "Paste a direct reel or post link to scrape its comments."}
            </p>
          </div>
          {jobSource === "accounts" && (
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex rounded-lg border p-1 gap-1">
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    scrapeType === "reels"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setScrapeType("reels")}
                >
                  Reels
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    scrapeType === "posts"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setScrapeType("posts")}
                >
                  Posts
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Lead Sources</Label>
            <div className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="scrapeComments"
                  checked={scrapeComments}
                  onCheckedChange={(v) => setScrapeComments(v === true)}
                  disabled={!scrapeLikers && !scrapeFollowers}
                />
                <Label htmlFor="scrapeComments" className="text-sm font-normal cursor-pointer">
                  Commenters
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="scrapeLikers"
                  checked={scrapeLikers}
                  onCheckedChange={(v) => setScrapeLikers(v === true)}
                  disabled={!scrapeComments && !scrapeFollowers}
                />
                <Label htmlFor="scrapeLikers" className="text-sm font-normal cursor-pointer">
                  Likers
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="scrapeFollowers"
                  checked={scrapeFollowers}
                  onCheckedChange={(v) => setScrapeFollowers(v === true)}
                  disabled={!scrapeComments && !scrapeLikers}
                />
                <Label htmlFor="scrapeFollowers" className="text-sm font-normal cursor-pointer">
                  Followers
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which users to scrape from each post/reel. At least one must be selected.
            </p>
          </div>
          {jobSource === "accounts" ? (
            <div className="space-y-2">
              <Label htmlFor="seeds">Seed Usernames</Label>
              <Textarea
                id="seeds"
                placeholder={"username1\nusername2\nusername3"}
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                rows={4}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  One username per line (without @). {parsedSeeds.length > 0 && `${parsedSeeds.length} account${parsedSeeds.length > 1 ? "s" : ""} detected.`}
                </p>
                {targets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={onOpenTargetPicker}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Add from history
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="directUrls">Post / Reel URL</Label>
              <Textarea
                id="directUrls"
                placeholder={"https://www.instagram.com/reel/ABC123/\nhttps://www.instagram.com/p/XYZ789/"}
                value={directUrlText}
                onChange={(e) => setDirectUrlText(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                One Instagram reel or post URL per line.{" "}
                {parsedDirectUrls.length > 0 && `${parsedDirectUrls.length} valid URL${parsedDirectUrls.length > 1 ? "s" : ""} detected.`}
              </p>
            </div>
          )}
          <div className={`grid gap-4 ${(() => {
            const cols = (jobSource === "accounts" ? 1 : 0) + (scrapeComments ? 1 : 0) + (jobMode === "outbound" ? 1 : 0);
            return cols >= 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-1";
          })()}`}>
            {jobSource === "accounts" && (
              <div className="space-y-2">
                <Label htmlFor="reelLimit">{scrapeType === "posts" ? "Post Limit" : "Reel Limit"}</Label>
                <Input
                  id="reelLimit"
                  type="number"
                  min={1}
                  value={reelLimit}
                  onChange={(e) => setReelLimit(Number(e.target.value))}
                />
              </div>
            )}
            {scrapeComments && (
              <div className="space-y-2">
                <Label htmlFor="commentLimit">Comment Limit</Label>
                <Input
                  id="commentLimit"
                  type="number"
                  min={1}
                  value={commentLimit}
                  onChange={(e) => setCommentLimit(Number(e.target.value))}
                />
              </div>
            )}
            {jobMode === "outbound" && (
              <div className="space-y-2">
                <Label htmlFor="minFollowers">Min Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  min={0}
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          {jobMode === "outbound" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="forceReprocess">Force Reprocess</Label>
                <p className="text-xs text-muted-foreground">
                  Re-process profiles that have already been scraped.
                </p>
              </div>
              <Switch
                id="forceReprocess"
                checked={forceReprocess}
                onCheckedChange={setForceReprocess}
              />
            </div>
          )}
          {jobMode === "outbound" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="scrapeEmails">Scrape Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Extract emails from profile data when available.
                </p>
              </div>
              <Switch
                id="scrapeEmails"
                checked={scrapeEmails}
                onCheckedChange={setScrapeEmails}
              />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Recurring</Label>
              <p className="text-xs text-muted-foreground">
                Automatically re-run this job on a schedule.
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          {isRecurring && (
            <div className="flex items-center gap-3 pl-1">
              <Label htmlFor="repeatInterval" className="whitespace-nowrap text-sm">Repeat Every</Label>
              <Input
                id="repeatInterval"
                type="number"
                min={1}
                className="w-20"
                value={repeatIntervalDays}
                onChange={(e) => setRepeatIntervalDays(Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          )}
          {jobMode === "outbound" && (
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {promptsList.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional AI prompt for qualifying leads.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onStart}
              disabled={!canStart || isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Deep Scrape
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
