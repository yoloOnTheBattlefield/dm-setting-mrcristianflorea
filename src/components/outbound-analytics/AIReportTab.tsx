import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
} from "lucide-react";
import {
  useGenerateAIReport,
  useAIReports,
  useAIReport,
  type AIReportContent,
  type AIReportListItem,
} from "@/hooks/useAIReports";

interface AIReportTabProps {
  filterParams: {
    start_date?: string;
    end_date?: string;
    campaign_id?: string;
  };
}

// ── Health helpers ────────────────────────────────────────

function healthColor(health: string) {
  if (health === "green") return "bg-emerald-500";
  if (health === "yellow") return "bg-amber-500";
  return "bg-red-500";
}

function healthLabel(health: string) {
  if (health === "green") return "Healthy";
  if (health === "yellow") return "Needs Attention";
  return "Critical";
}

function healthBadgeVariant(health: string): "default" | "secondary" | "destructive" | "outline" {
  if (health === "green") return "default";
  if (health === "yellow") return "secondary";
  return "destructive";
}

function ratingIcon(rating: string) {
  if (rating === "strong") return <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (rating === "weak") return <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-amber-500" />;
}

function ratingColor(rating: string) {
  if (rating === "strong") return "text-emerald-600";
  if (rating === "weak") return "text-red-600";
  return "text-amber-600";
}

function priorityBadge(priority: string) {
  if (priority === "high") return <Badge variant="destructive" className="text-xs">High</Badge>;
  if (priority === "medium") return <Badge variant="secondary" className="text-xs">Medium</Badge>;
  return <Badge variant="outline" className="text-xs">Low</Badge>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Main Component ───────────────────────────────────────

export function AIReportTab({ filterParams }: AIReportTabProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const generateMutation = useGenerateAIReport();
  const { data: reportsList, isLoading: isListLoading } = useAIReports();
  const { data: selectedReport } = useAIReport(selectedReportId);

  const handleGenerate = async () => {
    const result = await generateMutation.mutateAsync(filterParams);
    setSelectedReportId(result.report_id);
  };

  const isGenerating =
    generateMutation.isPending ||
    (selectedReport?.status === "generating");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">AI Analytics Report</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Claude analyzes your outreach data and generates actionable insights
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="gap-1.5"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isGenerating ? "Generating…" : "Generate Report"}
        </Button>
      </div>

      {/* Generating skeleton */}
      {isGenerating && !selectedReport?.report && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Analyzing your outreach data…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Claude is comparing senders, messages, industries, and timing patterns. This usually takes 10-20 seconds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {selectedReport?.status === "failed" && (
        <Card className="border-red-200">
          <CardContent className="py-4 px-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Report generation failed</p>
                <p className="text-xs text-red-600 mt-1">{selectedReport.error || "Unknown error"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report content */}
      {selectedReport?.status === "completed" && selectedReport.report && (
        <ReportDisplay report={selectedReport.report} />
      )}

      {/* Past reports */}
      {!isGenerating && reportsList && reportsList.length > 0 && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-3">Past Reports</h3>
            <div className="space-y-2">
              {reportsList.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedReportId(r._id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover:bg-muted/50",
                    selectedReportId === r._id && "border-primary bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {r.status === "completed" && r.report?.overall_health ? (
                      <div className={cn("w-2.5 h-2.5 rounded-full", healthColor(r.report.overall_health))} />
                    ) : r.status === "generating" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(r.date_range.start)} — {formatDate(r.date_range.end)}
                      </p>
                      {r.report?.executive_summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {r.report.executive_summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{r.type.replace("_", " ")}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isGenerating && !selectedReport?.report && (!reportsList || reportsList.length === 0) && !isListLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">No reports yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate your first AI report to get actionable insights about your outreach performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── PDF Export ───────────────────────────────────────────

function exportReportAsPDF(report: AIReportContent) {
  const healthColors: Record<string, string> = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444" };
  const healthLabels: Record<string, string> = { green: "Healthy", yellow: "Needs Attention", red: "Critical" };
  const priorityColors: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:24px"><h2 style="font-size:15px;font-weight:600;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px">${title}</h2>${content}</div>`;

  const recList = (items?: string[]) =>
    items?.length
      ? `<div style="margin-top:12px;padding-top:8px;border-top:1px solid #f3f4f6"><p style="font-size:12px;font-weight:600;margin:0 0 6px">Recommendations</p><ul style="margin:0;padding-left:18px">${items.map((r) => `<li style="font-size:12px;color:#6b7280;margin-bottom:4px">${r}</li>`).join("")}</ul></div>`
      : "";

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI Analytics Report</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px 24px; color: #1f2937; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }
  .niche-row { display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
  .msg-box { padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 12px; }
</style></head><body>`;

  html += `<h1 style="font-size:20px;font-weight:700;margin:0 0 4px">Outbound Analytics Report</h1>`;
  html += `<p style="font-size:12px;color:#6b7280;margin:0 0 24px">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>`;

  // Executive Summary
  html += section("Executive Summary",
    `<span class="badge" style="background:${healthColors[report.overall_health]}">${healthLabels[report.overall_health]}</span>
     <p style="font-size:13px;color:#4b5563;margin-top:8px;line-height:1.6">${report.executive_summary}</p>`);

  // Action Items
  if (report.action_items?.length) {
    html += section("Action Items",
      report.action_items.map((item) =>
        `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px;background:#f9fafb;border-radius:6px;margin-bottom:6px">
          <span class="badge" style="background:${priorityColors[item.priority]};flex-shrink:0">${item.priority}</span>
          <div><p style="font-size:12px;margin:0">${item.action}</p><p style="font-size:11px;color:#6b7280;margin:2px 0 0">${item.expected_impact}</p></div>
        </div>`
      ).join(""));
  }

  // Sender Analysis
  if (report.sender_analysis?.rankings?.length) {
    const ratingSymbols: Record<string, string> = { strong: "▲", average: "—", weak: "▼" };
    const ratingClr: Record<string, string> = { strong: "#10b981", average: "#f59e0b", weak: "#ef4444" };
    html += section("Sender Analysis",
      `<p style="font-size:12px;color:#6b7280;margin:0 0 8px">${report.sender_analysis.summary}</p>
      <table><thead><tr><th>Sender</th><th>Rating</th><th>Reason</th></tr></thead><tbody>
      ${report.sender_analysis.rankings.map((r) =>
        `<tr><td style="font-weight:500">@${r.sender}</td><td style="color:${ratingClr[r.rating]};font-weight:600">${ratingSymbols[r.rating]} ${r.rating}</td><td style="color:#6b7280">${r.reason}</td></tr>`
      ).join("")}</tbody></table>${recList(report.sender_analysis.recommendations)}`);
  }

  // Message Strategy
  if (report.message_strategy) {
    let msgContent = `<p style="font-size:12px;color:#6b7280;margin:0 0 8px">${report.message_strategy.summary}</p>`;
    if (report.message_strategy.top_performers?.length) {
      msgContent += `<p style="font-size:12px;font-weight:600;color:#10b981;margin:0 0 6px">Top Performers</p>`;
      msgContent += report.message_strategy.top_performers.map((m) =>
        `<div class="msg-box" style="background:#ecfdf5;border:1px solid #a7f3d0"><p style="font-family:monospace;margin:0;color:#065f46">"${m.preview}"</p><p style="margin:4px 0 0;color:#047857">${m.why_it_works}</p></div>`
      ).join("");
    }
    if (report.message_strategy.worst_performers?.length) {
      msgContent += `<p style="font-size:12px;font-weight:600;color:#ef4444;margin:12px 0 6px">Underperformers</p>`;
      msgContent += report.message_strategy.worst_performers.map((m) =>
        `<div class="msg-box" style="background:#fef2f2;border:1px solid #fecaca"><p style="font-family:monospace;margin:0;color:#991b1b">"${m.preview}"</p><p style="margin:4px 0 0;color:#dc2626">${m.why_it_fails}</p></div>`
      ).join("");
    }
    msgContent += recList(report.message_strategy.recommendations);
    html += section("Message Strategy", msgContent);
  }

  // Industry Analysis
  if (report.industry_analysis) {
    let indContent = `<p style="font-size:12px;color:#6b7280;margin:0 0 8px">${report.industry_analysis.summary}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">`;
    if (report.industry_analysis.best_niches?.length) {
      indContent += `<div><p style="font-size:12px;font-weight:600;color:#10b981;margin:0 0 6px">Best Responding</p>`;
      indContent += report.industry_analysis.best_niches.map((n) =>
        `<div class="niche-row" style="background:#ecfdf5"><span style="text-transform:capitalize;font-weight:500">${n.niche}</span><span style="color:#047857;font-weight:600">${n.reply_rate}%</span></div>`
      ).join("") + `</div>`;
    }
    if (report.industry_analysis.worst_niches?.length) {
      indContent += `<div><p style="font-size:12px;font-weight:600;color:#ef4444;margin:0 0 6px">Lowest Responding</p>`;
      indContent += report.industry_analysis.worst_niches.map((n) =>
        `<div class="niche-row" style="background:#fef2f2"><span style="text-transform:capitalize;font-weight:500">${n.niche}</span><span style="color:#dc2626;font-weight:600">${n.reply_rate}%</span></div>`
      ).join("") + `</div>`;
    }
    indContent += `</div>${recList(report.industry_analysis.recommendations)}`;
    html += section("Industry / Niche Analysis", indContent);
  }

  // Campaign Analysis
  if (report.campaign_analysis) {
    let campContent = `<p style="font-size:12px;color:#6b7280;margin:0 0 8px">${report.campaign_analysis.summary}</p>`;
    if (report.campaign_analysis.highlights?.length) {
      campContent += `<ul style="margin:0 0 8px;padding-left:18px">${report.campaign_analysis.highlights.map((h) => `<li style="font-size:12px;color:#6b7280;margin-bottom:4px">${h}</li>`).join("")}</ul>`;
    }
    campContent += recList(report.campaign_analysis.recommendations);
    html += section("Campaign Analysis", campContent);
  }

  // Timing Analysis
  if (report.timing_analysis) {
    html += section("Timing Analysis",
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
        <div style="padding:10px;background:#ecfdf5;border-radius:6px;border:1px solid #a7f3d0"><p style="font-size:11px;font-weight:600;color:#047857;margin:0 0 4px">Best Times</p><p style="font-size:12px;color:#065f46;margin:0">${report.timing_analysis.best_times}</p></div>
        <div style="padding:10px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca"><p style="font-size:11px;font-weight:600;color:#dc2626;margin:0 0 4px">Worst Times</p><p style="font-size:12px;color:#991b1b;margin:0">${report.timing_analysis.worst_times}</p></div>
      </div>${recList(report.timing_analysis.recommendations)}`);
  }

  html += `</body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ── Report Display ───────────────────────────────────────

function ReportDisplay({ report }: { report: AIReportContent }) {
  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <Card>
        <CardContent className="py-4 px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium">Executive Summary</h3>
                <Badge variant={healthBadgeVariant(report.overall_health)} className="text-xs">
                  <div className={cn("w-1.5 h-1.5 rounded-full mr-1", healthColor(report.overall_health))} />
                  {healthLabel(report.overall_health)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.executive_summary}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => exportReportAsPDF(report)}
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      {report.action_items?.length > 0 && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-3">Action Items</h3>
            <div className="space-y-2">
              {report.action_items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  {priorityBadge(item.priority)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.expected_impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sender Analysis */}
      {report.sender_analysis && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-1">Sender Analysis</h3>
            <p className="text-xs text-muted-foreground mb-3">{report.sender_analysis.summary}</p>

            {report.sender_analysis.rankings?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sender</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.sender_analysis.rankings.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">@{r.sender}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ratingIcon(r.rating)}
                          <span className={cn("text-xs font-medium capitalize", ratingColor(r.rating))}>{r.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <RecommendationsList items={report.sender_analysis.recommendations} />
          </CardContent>
        </Card>
      )}

      {/* Message Strategy */}
      {report.message_strategy && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-1">Message Strategy</h3>
            <p className="text-xs text-muted-foreground mb-3">{report.message_strategy.summary}</p>

            {report.message_strategy.top_performers?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Top Performers
                </p>
                <div className="space-y-2">
                  {report.message_strategy.top_performers.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-md bg-emerald-50 border border-emerald-100">
                      <p className="text-xs font-mono text-emerald-800 line-clamp-2">"{m.preview}"</p>
                      <p className="text-xs text-emerald-600 mt-1">{m.why_it_works}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.message_strategy.worst_performers?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Underperformers
                </p>
                <div className="space-y-2">
                  {report.message_strategy.worst_performers.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-md bg-red-50 border border-red-100">
                      <p className="text-xs font-mono text-red-800 line-clamp-2">"{m.preview}"</p>
                      <p className="text-xs text-red-600 mt-1">{m.why_it_fails}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <RecommendationsList items={report.message_strategy.recommendations} />
          </CardContent>
        </Card>
      )}

      {/* Industry Analysis */}
      {report.industry_analysis && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-1">Industry / Niche Analysis</h3>
            <p className="text-xs text-muted-foreground mb-3">{report.industry_analysis.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {report.industry_analysis.best_niches?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-2">Best Responding Niches</p>
                  {report.industry_analysis.best_niches.map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md bg-emerald-50 mb-1.5">
                      <span className="text-xs font-medium capitalize">{n.niche}</span>
                      <span className="text-xs text-emerald-700 font-medium">{n.reply_rate}%</span>
                    </div>
                  ))}
                </div>
              )}

              {report.industry_analysis.worst_niches?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-2">Lowest Responding Niches</p>
                  {report.industry_analysis.worst_niches.map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md bg-red-50 mb-1.5">
                      <span className="text-xs font-medium capitalize">{n.niche}</span>
                      <span className="text-xs text-red-700 font-medium">{n.reply_rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <RecommendationsList items={report.industry_analysis.recommendations} />
          </CardContent>
        </Card>
      )}

      {/* Campaign Analysis */}
      {report.campaign_analysis && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-1">Campaign Analysis</h3>
            <p className="text-xs text-muted-foreground mb-3">{report.campaign_analysis.summary}</p>

            {report.campaign_analysis.highlights?.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {report.campaign_analysis.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            <RecommendationsList items={report.campaign_analysis.recommendations} />
          </CardContent>
        </Card>
      )}

      {/* Timing Analysis */}
      {report.timing_analysis && (
        <Card>
          <CardContent className="py-4 px-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Timing Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-medium text-emerald-700 mb-1">Best Times</p>
                <p className="text-xs text-emerald-600">{report.timing_analysis.best_times}</p>
              </div>
              <div className="p-3 rounded-md bg-red-50 border border-red-100">
                <p className="text-xs font-medium text-red-700 mb-1">Worst Times</p>
                <p className="text-xs text-red-600">{report.timing_analysis.worst_times}</p>
              </div>
            </div>

            <RecommendationsList items={report.timing_analysis.recommendations} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Shared Components ────────────────────────────────────

function RecommendationsList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t">
      <p className="text-xs font-medium mb-2">Recommendations</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
