import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePrompts } from "@/hooks/usePrompts";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useStartImport, useImportStatus } from "@/hooks/useOutboundLeads";
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
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function ImportOutboundLeads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPromptId, setImportPromptId] = useState<string>("none");
  const [importCampaignId, setImportCampaignId] = useState<string>("none");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importStep, setImportStep] = useState<"config" | "mapping" | "importing">("config");
  const [xlsxHeaders, setXlsxHeaders] = useState<string[]>([]);
  const [xlsxPreviewRows, setXlsxPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const startImport = useStartImport();
  const { data: importStatus } = useImportStatus(importJobId);
  const { data: promptOptions = [] } = usePrompts();
  const { data: campaignsList } = useCampaigns({ limit: 100 });

  const isImporting = !!importJobId && importStatus?.status !== "done" && importStatus?.status !== "error";
  const importDone = importStatus?.status === "done";
  const importError = importStatus?.status === "error";
  const importProgress = importStatus
    ? Math.round((importStatus.processed / Math.max(importStatus.total, 1)) * 100)
    : 0;

  const handleNextToMapping = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    try {
      const { headers, previewRows } = await parseXlsxPreview(selectedFile);
      setXlsxHeaders(headers);
      setXlsxPreviewRows(previewRows);
      setImportStep("mapping");
    } catch (err) {
      toast({
        title: "Parse error",
        description: err instanceof Error ? err.message : "Failed to read file",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async (mapping: ColumnMapping) => {
    if (!selectedFile) return;
    setImportStep("importing");
    try {
      const { jobId } = await startImport.mutateAsync({
        file: selectedFile,
        promptId: importPromptId !== "none" ? importPromptId : undefined,
        campaignId: importCampaignId !== "none" ? importCampaignId : undefined,
        columnMapping: mapping,
      });
      setImportJobId(jobId);
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setImportStep("mapping");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to outbound leads" onClick={() => navigate("/outbound-leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import Leads</h2>
          <p className="text-sm text-muted-foreground">
            Import outbound leads from a pre-processed XLSX or CSV file
          </p>
        </div>
      </div>

      {/* Step 1: Config — file picker + options */}
      {importStep === "config" && !importJobId && (
        <div className="space-y-4">
          <Card
            className={`flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${
              isDragOver
                ? "border-primary bg-primary/5"
                : selectedFile
                  ? "border-green-500/30"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center gap-3 py-12">
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-green-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop your .xlsx or .csv file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports any spreadsheet or CSV with lead data
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                  e.target.value = "";
                }}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Qualification Prompt</Label>
              <Select value={importPromptId} onValueChange={setImportPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prompt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {promptOptions.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The prompt these leads were qualified through
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Link to Campaign</Label>
              <Select value={importCampaignId} onValueChange={setImportCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(campaignsList?.campaigns || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Messaged leads will appear in this campaign's analytics
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNextToMapping}
              disabled={!selectedFile || isParsing}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Reading file...
                </>
              ) : (
                <>
                  Next: Map Columns
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {importStep === "mapping" && !importJobId && (
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
              onConfirm={handleImport}
              onBack={() => setImportStep("config")}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing — progress */}
      {isImporting && importStatus && (
        <Card className="border-blue-500/30">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400 shrink-0" />
              <p className="text-sm font-medium">{importStatus.step}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{importStatus.processed} / {importStatus.total} rows</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2.5" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{importStatus.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{importStatus.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{importStatus.campaignLeadsCreated}</p>
                <p className="text-xs text-muted-foreground">Campaign</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {importDone && importStatus && (
        <Card className="border-green-500/30">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-sm font-medium">Import complete</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-green-400">{importStatus.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{importStatus.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{importStatus.campaignLeadsCreated}</p>
                <p className="text-xs text-muted-foreground">Campaign</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {importStatus.imported} of {importStatus.total} leads imported successfully.
              {importStatus.campaignLeadsCreated > 0 && ` ${importStatus.campaignLeadsCreated} linked to campaign.`}
            </p>
            <div className="flex justify-end">
              <Button onClick={() => navigate("/outbound-leads")}>
                Back to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4b: Error */}
      {importError && importStatus && (
        <Card className="border-red-500/30">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium">Import failed</p>
            </div>
            <p className="text-sm text-destructive">{importStatus.step}</p>
            {importStatus.errors && importStatus.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded border p-3 text-xs space-y-1">
                {importStatus.errors.map((e, i) => (
                  <p key={i}>@{e.username}: {e.error}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/outbound-leads")}>
                Back to Leads
              </Button>
              <Button
                onClick={() => {
                  setImportJobId(null);
                  setImportStep("mapping");
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
