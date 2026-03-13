import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Trash2, RotateCcw, AlertTriangle } from "lucide-react";

interface ApifyToken {
  _id: string;
  label?: string;
  token: string;
  status: string;
}

interface ApifyUsage {
  _id: string;
  error?: boolean;
  totalUsageUsd?: number;
  monthlyUsageLimitUsd?: number;
  usageCycle?: { startAt: string; endAt: string } | null;
}

interface ApifyTokensCardProps {
  tokens: ApifyToken[];
  isLoading: boolean;
  apifyUsageMap: Map<string, ApifyUsage>;
  newApifyLabel: string;
  newApifyToken: string;
  onNewLabelChange: (value: string) => void;
  onNewTokenChange: (value: string) => void;
  onAddToken: () => void;
  onDeleteToken: (id: string) => void;
  onResetToken: (id: string) => void;
  isAdding: boolean;
  isDeleting: boolean;
  isResetting: boolean;
}

export default function ApifyTokensCard({
  tokens,
  isLoading,
  apifyUsageMap,
  newApifyLabel,
  newApifyToken,
  onNewLabelChange,
  onNewTokenChange,
  onAddToken,
  onDeleteToken,
  onResetToken,
  isAdding,
  isDeleting,
  isResetting,
}: ApifyTokensCardProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const active = tokens.filter((t) => t.status === "active").length;
  const limited = tokens.filter((t) => t.status === "limit_reached").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apify API Tokens</CardTitle>
              <CardDescription>
                Manage multiple Apify tokens for deep scraping. Tokens auto-rotate when one hits its monthly limit.
              </CardDescription>
            </div>
            {tokens.length > 0 && (
              <div className="flex gap-1.5">
                {active > 0 && (
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {active} active
                  </Badge>
                )}
                {limited > 0 && (
                  <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {limited} limited
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token list */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading tokens...
            </div>
          ) : tokens.length > 0 ? (
            <div className="space-y-2">
              <Label>Saved Tokens</Label>
              <div className="space-y-1.5">
                {tokens.map((t) => (
                  <div
                    key={t._id}
                    className={`rounded-md border px-3 py-2 ${
                      t.status === "limit_reached" ? "border-orange-500/30 bg-orange-500/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {t.label || "Unnamed"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{t.token}</span>
                        {t.status === "active" && (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px] px-1.5 py-0 shrink-0">
                            Active
                          </Badge>
                        )}
                        {t.status === "limit_reached" && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-[10px] px-1.5 py-0 shrink-0">
                            Limit Reached
                          </Badge>
                        )}
                        {t.status === "disabled" && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0 shrink-0">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.status === "limit_reached" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-green-500"
                            onClick={() => onResetToken(t._id)}
                            disabled={isResetting}
                            title="Reset to active"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(t._id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {(() => {
                      const usage = apifyUsageMap.get(t._id);
                      if (!usage) return null;
                      if (usage.error) return (
                        <p className="text-[10px] text-muted-foreground mt-1">Usage: unavailable</p>
                      );
                      const used = usage.totalUsageUsd ?? 0;
                      const limit = usage.monthlyUsageLimitUsd;
                      const pct = limit ? Math.min((used / limit) * 100, 100) : null;
                      return (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>${used.toFixed(2)} used{limit ? ` / $${limit.toFixed(2)} limit` : ""}</span>
                            <div className="flex items-center gap-2">
                              {usage.usageCycle?.endAt && (
                                <span>Resets {new Date(usage.usageCycle.endAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              )}
                              {pct !== null && <span>{pct.toFixed(0)}%</span>}
                            </div>
                          </div>
                          {pct !== null && (
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-green-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No Apify tokens added yet.</p>
          )}

          {/* Add new token form */}
          <div className="border-t pt-4 space-y-3">
            <Label>Add Token</Label>
            <div className="space-y-2">
              <Label htmlFor="apify-label" className="text-xs text-muted-foreground">Label (optional)</Label>
              <Input
                id="apify-label"
                placeholder="e.g. Main account, Backup"
                value={newApifyLabel}
                onChange={(e) => onNewLabelChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apify-token-new" className="text-xs text-muted-foreground">API Token</Label>
              <Input
                id="apify-token-new"
                type="password"
                placeholder="apify_api_..."
                value={newApifyToken}
                onChange={(e) => onNewTokenChange(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={onAddToken}
                disabled={isAdding || !newApifyToken.trim()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Token"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apify Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Apify Token</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this token. Any scraping jobs using it will switch to another available token.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteToken(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
