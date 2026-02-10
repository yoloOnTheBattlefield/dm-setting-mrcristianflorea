import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { QualificationJob } from "@/hooks/useJobs";
import { FileSpreadsheet, Clock, AlertCircle } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  running: { label: "Running", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  completed: { label: "Completed", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cancelled: { label: "Cancelled", className: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function JobCard({ job }: { job: QualificationJob }) {
  const style = STATUS_STYLES[job.status] || STATUS_STYLES.queued;
  const progressPct = job.totalLeads > 0 ? Math.round((job.processedLeads / job.totalLeads) * 100) : 0;

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={style.className}>{style.label}</Badge>
            {job.promptLabel && (
              <span className="text-xs text-muted-foreground truncate">
                {job.promptLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {formatDate(job.createdAt)}
          </div>
        </div>

        {job.status === "running" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{job.processedLeads} / {job.totalLeads} leads</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {job.files.length} file{job.files.length !== 1 ? "s" : ""}
          </div>
          <div>
            <span className="text-muted-foreground">Processed:</span>{" "}
            <span className="font-medium">{job.processedLeads}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Qualified:</span>{" "}
            <span className="font-medium text-green-400">{job.qualifiedLeads}</span>
          </div>
          {job.failedLeads > 0 && (
            <div>
              <span className="text-muted-foreground">Failed:</span>{" "}
              <span className="font-medium text-red-400">{job.failedLeads}</span>
            </div>
          )}
        </div>

        {job.error && (
          <div className="flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {job.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
