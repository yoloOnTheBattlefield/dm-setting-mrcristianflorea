import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { usePrompts } from "@/hooks/usePrompts";
import { useJobs, useCancelJob } from "@/hooks/useJobs";
import { useJobProgress } from "@/hooks/useJobProgress";
import JobCard from "@/components/JobCard";
import ColumnMapper from "@/components/ColumnMapper";
import { parseXlsxPreview, type ColumnMapping } from "@/lib/column-mapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  X,
  Ban,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

const FILENAME_REGEX = /^(follower|following)-of-(.+)-(\d{8})\.xlsx$/;

function parseFilename(name: string) {
  const match = name.match(FILENAME_REGEX);
  if (!match) return null;
  const type = match[1];
  const account = match[2];
  const dateStr = match[3];
  const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  return { type, account, date: formattedDate };
}

const FILE_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  processing: { label: "Processing", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  completed: { label: "Done", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  queued: { label: "Queued", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
};

export default function UploadXlsx() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("none");
  const [uploadStep, setUploadStep] = useState<"select" | "mapping" | "uploading">("select");
  const [xlsxHeaders, setXlsxHeaders] = useState<string[]>([]);
  const [xlsxPreviewRows, setXlsxPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { data: prompts = [] } = usePrompts();
  const { data: jobsData } = useJobs();
  const cancelJob = useCancelJob();
  const liveProgress = useJobProgress(activeJobId);

  const jobs = jobsData?.jobs ?? [];

  // Auto-select default prompt on load
  useEffect(() => {
    if (prompts.length > 0 && selectedPromptId === "none") {
      const defaultPrompt = prompts.find((p) => p.isDefault);
      if (defaultPrompt) setSelectedPromptId(defaultPrompt._id);
    }
  }, [prompts, selectedPromptId]);

  // Build active job from REST data (for filenames, fallback progress)
  const activeJobData = activeJobId ? jobs.find((j) => j._id === activeJobId) : null;

  // Auto-detect running job on mount
  useEffect(() => {
    if (!activeJobId && jobs.length > 0) {
      const running = jobs.find((j) => j.status === "running" || j.status === "queued");
      if (running) setActiveJobId(running._id);
    }
  }, [activeJobId, jobs]);

  // Derive effective status: prefer live socket data, fall back to REST data
  const effectiveStatus = liveProgress.status || activeJobData?.status || null;
  const isTerminal = effectiveStatus === "completed" || effectiveStatus === "failed" || effectiveStatus === "cancelled";
  const isActive = effectiveStatus === "running" || effectiveStatus === "queued";

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: File[] = [];
      for (const f of Array.from(incoming)) {
        if (!f.name.endsWith(".xlsx")) {
          toast({ title: "Invalid file", description: `${f.name}: Only .xlsx files are accepted`, variant: "destructive" });
          continue;
        }
        if (!FILENAME_REGEX.test(f.name)) {
          toast({
            title: "Invalid filename",
            description: `${f.name}: Must match follower-of-{account}-{YYYYMMDD}.xlsx or following-of-...`,
            variant: "destructive",
          });
          continue;
        }
        newFiles.push(f);
      }
      if (newFiles.length > 0) {
        setFiles((prev) => {
          const existingNames = new Set(prev.map((f) => f.name));
          const unique = newFiles.filter((f) => !existingNames.has(f.name));
          return [...prev, ...unique];
        });
      }
    },
    [toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleNextToMapping = async () => {
    if (files.length === 0) return;
    setIsParsing(true);
    try {
      const { headers, previewRows } = await parseXlsxPreview(files[0]);
      setXlsxHeaders(headers);
      setXlsxPreviewRows(previewRows);
      setUploadStep("mapping");
    } catch (err) {
      toast({
        title: "Parse error",
        description: err instanceof Error ? err.message : "Could not read file headers",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async (mapping?: ColumnMapping) => {
    if (files.length === 0) return;
    setIsSubmitting(true);
    setUploadStep("uploading");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      if (selectedPromptId !== "none") {
        formData.append("promptId", selectedPromptId);
      }
      if (mapping) {
        formData.append("columnMapping", JSON.stringify(mapping));
      }

      const response = await fetchWithAuth(`${API_URL}/jobs`, {
        method: "POST",
        body: formData,
      });

      if (response.ok || response.status === 201) {
        const data = await response.json();
        setActiveJobId(data.jobId);
        setFiles([]);
        setUploadStep("select");
        toast({ title: "Job created", description: "Processing started. You can track progress below." });
      } else {
        const data = await response.json().catch(() => ({}));
        setUploadStep("select");
        toast({ title: "Upload failed", description: data.error || `Server error: ${response.status}`, variant: "destructive" });
      }
    } catch {
      setUploadStep("select");
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!activeJobId) return;
    cancelJob.mutate(activeJobId, {
      onSuccess: () => toast({ title: "Cancel requested", description: "The job will stop after the current row." }),
      onError: (err) => toast({ title: "Cancel failed", description: err.message, variant: "destructive" }),
    });
  };

  // Compute aggregate progress — prefer live socket data, fall back to REST job data
  const hasLiveData = liveProgress.fileProgresses.size > 0;
  let totalProcessed = 0;
  let totalFiltered = 0;
  let totalQualified = 0;
  let totalFailed = 0;

  if (hasLiveData) {
    liveProgress.fileProgresses.forEach((fp) => {
      totalProcessed += fp.processedRows;
      totalFiltered += fp.totalFilteredRows;
      totalQualified += fp.qualifiedCount;
      totalFailed += fp.failedRows;
    });
  } else if (activeJobData) {
    totalProcessed = activeJobData.processedLeads;
    totalFiltered = activeJobData.totalLeads;
    totalQualified = activeJobData.qualifiedLeads;
    totalFailed = activeJobData.failedLeads;
  }

  const overallPct = totalFiltered > 0 ? Math.round((totalProcessed / totalFiltered) * 100) : 0;
  const showActiveJob = activeJobId && isActive;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold tracking-tight">Upload XLSX</h2>
      <p className="text-sm text-muted-foreground -mt-2">
        Upload IG scraper exports to qualify and import profiles
      </p>

      {/* Drop zone */}
      {uploadStep === "select" && <Card
        className={`flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop your .xlsx files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              follower-of-&#123;account&#125;-&#123;YYYYMMDD&#125;.xlsx or following-of-&#123;account&#125;-&#123;YYYYMMDD&#125;.xlsx
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>}

      {/* Prompt selector */}
      {uploadStep === "select" && <div className="flex flex-col gap-2 max-w-sm">
        <Label>Classification Prompt (optional)</Label>
        <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a prompt..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Prompt</SelectItem>
            {prompts.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.label}{p.isDefault ? " (default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>}

      {/* Selected files preview */}
      {uploadStep === "select" && files.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            {files.map((file, idx) => {
              const parsed = parseFilename(file.name);
              return (
                <div key={file.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-stage-booked shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      {parsed && (
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{parsed.type}</Badge>
                          <Badge variant="outline">@{parsed.account}</Badge>
                          <Badge variant="outline">{parsed.date}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={isSubmitting}>
                Clear All
              </Button>
              <Button size="sm" onClick={handleNextToMapping} disabled={isParsing || isSubmitting || !!showActiveJob}>
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Reading headers...
                  </>
                ) : (
                  <>
                    Next: Map Columns
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column mapping step */}
      {uploadStep === "mapping" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Map Columns</CardTitle>
            <p className="text-xs text-muted-foreground">
              Match your spreadsheet columns to the correct fields
            </p>
          </CardHeader>
          <CardContent>
            <ColumnMapper
              headers={xlsxHeaders}
              previewRows={xlsxPreviewRows}
              onConfirm={(mapping) => handleUpload(mapping)}
              onBack={() => setUploadStep("select")}
            />
          </CardContent>
        </Card>
      )}

      {/* Active job progress */}
      {showActiveJob && (
        <Card className="border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                Job in Progress
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelJob.isPending}
              >
                <Ban className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalProcessed} / {totalFiltered} leads processed</span>
                <span>{overallPct}%</span>
              </div>
              <Progress value={overallPct} className="h-2.5" />
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-lg font-semibold">{totalFiltered}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processed</p>
                <p className="text-lg font-semibold">{totalProcessed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qualified</p>
                <p className="text-lg font-semibold text-green-400">{totalQualified}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg font-semibold text-red-400">{totalFailed}</p>
              </div>
            </div>

            {/* Per-file breakdown */}
            {activeJobData && activeJobData.files.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Files</p>
                {activeJobData.files.map((file, idx) => {
                  const fileProgress = liveProgress.fileProgresses.get(idx);
                  const fileStatus = liveProgress.fileStatuses.get(idx) || file.status;
                  const style = FILE_STATUS_STYLES[fileStatus] || FILE_STATUS_STYLES.queued;

                  // Use live socket data if available, otherwise REST data
                  const processedRows = fileProgress?.processedRows ?? file.processedRows;
                  const filteredRows = fileProgress?.totalFilteredRows ?? file.filteredRows;
                  const filePct = filteredRows > 0
                    ? Math.round((processedRows / filteredRows) * 100)
                    : 0;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate">{file.filename}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {fileStatus === "processing" && (
                            <span className="text-[10px] text-muted-foreground">{processedRows}/{filteredRows}</span>
                          )}
                          <Badge className={`${style.className} text-[10px] px-1.5 py-0`}>{style.label}</Badge>
                        </div>
                      </div>
                      {(fileStatus === "processing") && filteredRows > 0 && (
                        <Progress value={filePct} className="h-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed/failed job result */}
      {activeJobId && isTerminal && (
        <Card className={effectiveStatus === "completed" ? "border-green-500/30" : "border-red-500/30"}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {effectiveStatus === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="font-medium">
                  {effectiveStatus === "completed" ? "Job Complete" : effectiveStatus === "cancelled" ? "Job Cancelled" : "Job Failed"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveJobId(null)}>
                Dismiss
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Qualified</p>
                <p className="text-lg font-semibold text-green-400">
                  {liveProgress.totalQualified ?? activeJobData?.qualifiedLeads ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg font-semibold text-red-400">
                  {liveProgress.totalFailed ?? activeJobData?.failedLeads ?? 0}
                </p>
              </div>
            </div>

            {(liveProgress.error || activeJobData?.error) && (
              <div className="flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {liveProgress.error || activeJobData?.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Recent Jobs</h3>
          </div>
          <div className="space-y-2">
            {jobs
              .filter((j) => j._id !== activeJobId)
              .slice(0, 10)
              .map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
