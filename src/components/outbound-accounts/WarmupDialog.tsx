import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Flame,
  Play,
  Square,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { type OutboundAccount } from "@/hooks/useOutboundAccounts";

interface WarmupStatusData {
  enabled: boolean;
  currentDay: number;
  automationBlocked: boolean;
  todayCap: number | null;
  checklistProgress: { completed: number; total: number };
  checklist: { key: string; label: string; completed: boolean }[];
  schedule: { day: number; cap: number }[];
}

interface WarmupLog {
  _id: string;
  action: string;
  details?: { label?: string; completed?: boolean };
  performedBy: string;
  createdAt: string;
}

interface WarmupLogsData {
  logs: WarmupLog[];
}

interface WarmupDialogProps {
  warmupAccount: OutboundAccount | null;
  onOpenChange: (open: boolean) => void;
  warmupData: WarmupStatusData | undefined;
  warmupLoading: boolean;
  logsData: WarmupLogsData | undefined;
  warmupProgress: number;
  onStartWarmup: (account: OutboundAccount) => Promise<void>;
  onStopWarmup: () => Promise<void>;
  onToggleChecklist: (key: string) => Promise<void>;
  startWarmupPending: boolean;
  stopWarmupPending: boolean;
  toggleChecklistPending: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  warmup_started: "Warmup started",
  warmup_stopped: "Warmup stopped",
  warmup_completed: "Warmup completed",
  checklist_toggled: "Checklist updated",
  cap_enforced: "Cap enforced",
};

export default function WarmupDialog({
  warmupAccount,
  onOpenChange,
  warmupData,
  warmupLoading,
  logsData,
  warmupProgress,
  onStartWarmup,
  onStopWarmup,
  onToggleChecklist,
  startWarmupPending,
  stopWarmupPending,
  toggleChecklistPending,
}: WarmupDialogProps) {
  return (
    <Dialog open={!!warmupAccount} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-yellow-400" />
            Warmup: @{warmupAccount?.username}
          </DialogTitle>
          <DialogDescription>
            Track warmup progress, checklist, and automation status.
          </DialogDescription>
        </DialogHeader>

        {warmupLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : warmupData?.enabled ? (
          <div className="space-y-5 pt-2">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Day {warmupData.currentDay} of 14
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStopWarmup}
                  disabled={stopWarmupPending}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <Square className="h-3 w-3 mr-1.5" />
                  {stopWarmupPending ? "Stopping..." : "Stop Warmup"}
                </Button>
              </div>
              <Progress value={warmupProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {warmupData.currentDay >= 15
                  ? "Warmup complete"
                  : `${Math.round(warmupProgress)}% complete`}
              </p>
            </div>

            {/* Automation Status */}
            <div className={`rounded-lg border p-3 ${
              warmupData.automationBlocked
                ? "border-red-500/30 bg-red-500/5"
                : "border-green-500/30 bg-green-500/5"
            }`}>
              <div className="flex items-center gap-2">
                {warmupData.automationBlocked ? (
                  <>
                    <ShieldOff className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Automation blocked until Day 9
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Automation active — {warmupData.todayCap !== null ? `${warmupData.todayCap} DMs/day cap` : "No cap"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Checklist</h4>
                <span className="text-xs text-muted-foreground">
                  {warmupData.checklistProgress.completed}/{warmupData.checklistProgress.total} complete
                </span>
              </div>
              <div className="space-y-2">
                {warmupData.checklist.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 cursor-pointer rounded-md border border-white/5 px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => onToggleChecklist(item.key)}
                      disabled={toggleChecklistPending}
                    />
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h4 className="text-sm font-medium mb-2">Warmup Schedule</h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-1.5 text-xs">Day</TableHead>
                      <TableHead className="py-1.5 text-xs">DM Cap</TableHead>
                      <TableHead className="py-1.5 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warmupData.schedule.map((s) => {
                      const isCurrent = s.day === warmupData.currentDay;
                      const isPast = s.day < warmupData.currentDay;
                      return (
                        <TableRow
                          key={s.day}
                          className={isCurrent ? "bg-yellow-500/10" : isPast ? "opacity-50" : ""}
                        >
                          <TableCell className="py-1.5 text-xs font-mono">
                            {s.day}
                            {isCurrent && (
                              <Badge className="ml-1.5 text-[9px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                                TODAY
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs">
                            {s.cap === 0 ? "-" : s.cap}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-muted-foreground">
                            {s.cap === 0 ? "Blocked" : "Active"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Activity Log */}
            {logsData && logsData.logs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Activity Log</h4>
                <div className="space-y-1.5">
                  {logsData.logs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5"
                    >
                      <div>
                        <span className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="ml-2">
                          {ACTION_LABELS[log.action] || log.action}
                          {log.details?.label && (
                            <span className="text-muted-foreground">
                              : &ldquo;{log.details.label as string}&rdquo;
                              {log.details?.completed ? " ✓" : " ✗"}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{log.performedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-3">Warmup is not active for this account.</p>
            <Button
              onClick={() => warmupAccount && onStartWarmup(warmupAccount)}
              disabled={startWarmupPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {startWarmupPending ? "Starting..." : "Start Warmup"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
