import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentStats } from "@/hooks/useAgent";
import { AGENT_STAGES, STAGE_LABELS } from "@/lib/agent";
import { cn } from "@/lib/utils";

export function PipelineCard() {
  const { data, isLoading, isError } = useAgentStats();
  const stages = data?.stages ?? {};
  const max = Math.max(1, ...AGENT_STAGES.map((s) => stages[s] ?? 0));

  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardTitle className="text-base sm:text-lg">Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load pipeline</p>
        ) : (
          <ul className="space-y-2">
            {AGENT_STAGES.map((stage) => {
              const n = stages[stage] ?? 0;
              return (
                <li key={stage} data-testid={`stage-${stage}`} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-muted-foreground">{STAGE_LABELS[stage]}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        stage === "won" ? "bg-emerald-500" : stage === "lost" ? "bg-red-400" : "bg-primary",
                      )}
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums font-medium">{n.toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
