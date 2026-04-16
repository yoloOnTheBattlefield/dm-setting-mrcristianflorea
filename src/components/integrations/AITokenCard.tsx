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
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { AIProviderUsage } from "@/hooks/useAIUsage";

interface AITokenCardProps {
  title: string;
  description: string;
  inputId: string;
  placeholder: string;
  token: string;
  savedToken: string;
  isSaving: boolean;
  onTokenChange: (value: string) => void;
  onSave: () => void;
  usage?: AIProviderUsage | null;
  usageLoading?: boolean;
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function UsageDisplay({ usage, loading }: { usage?: AIProviderUsage | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Fetching usage...
      </div>
    );
  }

  if (!usage) return null;

  if (usage.error) {
    return (
      <p className="text-[11px] text-muted-foreground">{usage.error}</p>
    );
  }

  // OpenAI org costs
  if (usage.source === "organization" && usage.totalUsageUsd != null) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            ${usage.totalUsageUsd.toFixed(2)} used this month
          </span>
        </div>
      </div>
    );
  }

  // OpenAI credit grants
  if (usage.source === "credits") {
    const granted = usage.totalGranted ?? 0;
    const used = usage.totalUsed ?? 0;
    const available = usage.totalAvailable ?? 0;
    const pct = granted > 0 ? Math.min((used / granted) * 100, 100) : null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>${used.toFixed(2)} used / ${granted.toFixed(2)} granted</span>
          {pct !== null && <span>{pct.toFixed(0)}%</span>}
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
        <p className="text-[10px] text-muted-foreground">${available.toFixed(2)} remaining</p>
      </div>
    );
  }

  // Anthropic usage
  if (usage.source === "usage") {
    return (
      <div className="space-y-1">
        {usage.totalUsageUsd != null && (
          <div className="text-[11px] text-muted-foreground">
            ${usage.totalUsageUsd.toFixed(2)} used this month
          </div>
        )}
        {(usage.inputTokens != null || usage.outputTokens != null) && (
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            {usage.inputTokens != null && (
              <span>{formatTokenCount(usage.inputTokens)} input tokens</span>
            )}
            {usage.outputTokens != null && (
              <span>{formatTokenCount(usage.outputTokens)} output tokens</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function AITokenCard({
  title,
  description,
  inputId,
  placeholder,
  token,
  savedToken,
  isSaving,
  onTokenChange,
  onSave,
  usage,
  usageLoading,
}: AITokenCardProps) {
  const hasChanged = token.trim() !== savedToken;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {savedToken ? (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              Server Default
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={inputId}>API Key</Label>
          <Input
            id={inputId}
            type="password"
            placeholder={placeholder}
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
          />
        </div>

        {/* Usage display */}
        {savedToken && (usage || usageLoading) && (
          <div className="rounded-md border px-3 py-2">
            <UsageDisplay usage={usage} loading={usageLoading} />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasChanged}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
