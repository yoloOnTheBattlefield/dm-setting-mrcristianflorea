import { useState, useCallback } from "react";
import { useImportBookings } from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

// Booking fields that can be mapped from CSV columns
const BOOKING_FIELDS = [
  { key: "contact_name", label: "Contact Name", required: true },
  { key: "email", label: "Email" },
  { key: "booking_date", label: "Booking Date", required: true },
  { key: "status", label: "Status" },
  { key: "source", label: "Source (inbound/outbound)" },
  { key: "cash_collected", label: "Cash Collected" },
  { key: "contract_value", label: "Contract Value" },
  { key: "notes", label: "Notes" },
  { key: "utm_source", label: "UTM Source" },
  { key: "utm_medium", label: "UTM Medium" },
  { key: "ig_username", label: "IG Username" },
] as const;

type BookingFieldKey = (typeof BOOKING_FIELDS)[number]["key"];

// Synonyms for auto-mapping Calendly CSV headers
const SYNONYMS: Record<BookingFieldKey, string[]> = {
  contact_name: ["invitee name", "name", "contact name", "contact", "full name", "invitee full name"],
  email: ["invitee email", "email", "e-mail", "email address"],
  booking_date: [
    "start date & time", "event date/time", "event date", "date", "booking date",
    "start date", "scheduled date", "event start date/time", "start date and time",
  ],
  status: ["status", "event status", "booking status", "canceled", "cancelled"],
  source: ["source", "booking source"],
  cash_collected: ["cash collected", "cash", "amount paid", "payment"],
  contract_value: ["contract value", "contract", "deal value", "value", "revenue"],
  notes: ["notes", "event notes", "event description", "description", "invitee notes"],
  utm_source: ["utm source", "utm_source", "utmsource"],
  utm_medium: ["utm medium", "utm_medium", "utmmedium"],
  ig_username: ["ig username", "ig handle", "instagram", "ig", "username"],
};

function autoSuggestMapping(headers: string[]): Record<string, BookingFieldKey | null> {
  const mapping: Record<string, BookingFieldKey | null> = {};
  const usedFields = new Set<BookingFieldKey>();

  for (const header of headers) {
    const headerLower = header.toLowerCase().trim();
    let bestMatch: BookingFieldKey | null = null;
    let bestLength = 0;

    for (const [field, synonyms] of Object.entries(SYNONYMS) as [BookingFieldKey, string[]][]) {
      if (usedFields.has(field)) continue;
      for (const synonym of synonyms) {
        if (headerLower === synonym || headerLower.includes(synonym)) {
          if (synonym.length > bestLength) {
            bestMatch = field;
            bestLength = synonym.length;
          }
        }
      }
    }

    if (bestMatch) {
      mapping[header] = bestMatch;
      usedFields.add(bestMatch);
    } else {
      mapping[header] = null;
    }
  }

  return mapping;
}

type Step = "upload" | "mapping" | "result";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

interface ImportBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBookingsDialog({ open, onOpenChange }: ImportBookingsDialogProps) {
  const { toast } = useToast();
  const importMutation = useImportBookings();

  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<Record<string, unknown>[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, BookingFieldKey | null>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setHeaders([]);
    setAllRows([]);
    setPreviewRows([]);
    setMapping({});
    setResult(null);
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      toast({ title: "Please upload a CSV or Excel file", variant: "destructive" });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

      if (rows.length === 0) {
        toast({ title: "File is empty", variant: "destructive" });
        return;
      }

      const hdrs = Object.keys(rows[0]);
      setHeaders(hdrs);
      setAllRows(rows);
      setPreviewRows(rows.slice(0, 5));
      setMapping(autoSuggestMapping(hdrs));
      setStep("mapping");
    } catch {
      toast({ title: "Failed to parse file", variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const mappedFieldCount = Object.values(mapping).filter(Boolean).length;
  const hasRequiredFields = (() => {
    const mapped = new Set(Object.values(mapping).filter(Boolean));
    return mapped.has("contact_name") && mapped.has("booking_date");
  })();

  const handleImport = async () => {
    // Transform rows using the mapping
    const mappedRows = allRows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const [header, field] of Object.entries(mapping)) {
        if (!field) continue;
        let value = row[header];
        // Handle date objects from xlsx
        if (field === "booking_date" && value instanceof Date) {
          value = value.toISOString();
        } else if (field === "booking_date" && typeof value === "string") {
          // Try to parse various date formats
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) value = parsed.toISOString();
        }
        mapped[field] = value;
      }
      return mapped;
    });

    try {
      const res = await importMutation.mutateAsync(mappedRows);
      setResult(res);
      setStep("result");
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Bookings"}
            {step === "mapping" && "Map Columns"}
            {step === "result" && "Import Complete"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("csv-file-input")?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop your Calendly CSV export here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse (.csv, .xlsx, .xls)</p>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {allRows.length} rows found · {mappedFieldCount} columns mapped
              </p>
              {!hasRequiredFields && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Map Contact Name & Booking Date
                </Badge>
              )}
            </div>

            {/* Mapping table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">CSV Column</TableHead>
                    <TableHead className="w-1/3">Maps To</TableHead>
                    <TableHead className="w-1/3">Sample</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="text-xs font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping[header] ?? "__ignore__"}
                          onValueChange={(v) =>
                            setMapping((prev) => ({ ...prev, [header]: v === "__ignore__" ? null : (v as BookingFieldKey) }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__ignore__">
                              <span className="text-muted-foreground">Ignore</span>
                            </SelectItem>
                            {BOOKING_FIELDS.map((f) => {
                              const usedByOther = Object.entries(mapping).some(
                                ([h, v]) => v === f.key && h !== header,
                              );
                              return (
                                <SelectItem key={f.key} value={f.key} disabled={usedByOther}>
                                  {f.label}
                                  {f.required && " *"}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {previewRows[0]?.[header] instanceof Date
                          ? (previewRows[0][header] as Date).toLocaleString()
                          : String(previewRows[0]?.[header] ?? "")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Preview */}
            {previewRows.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Preview first {previewRows.length} rows
                </summary>
                <div className="mt-2 rounded border overflow-x-auto max-h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.filter((h) => mapping[h]).map((h) => (
                          <TableHead key={h} className="text-[10px] whitespace-nowrap">
                            {BOOKING_FIELDS.find((f) => f.key === mapping[h])?.label ?? h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, i) => (
                        <TableRow key={i}>
                          {headers.filter((h) => mapping[h]).map((h) => (
                            <TableCell key={h} className="text-[10px] whitespace-nowrap">
                              {row[h] instanceof Date
                                ? (row[h] as Date).toLocaleString()
                                : String(row[h] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </details>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={reset}>
                Back
              </Button>
              <Button
                size="sm"
                disabled={!hasRequiredFields || importMutation.isPending}
                onClick={handleImport}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                {importMutation.isPending ? "Importing..." : `Import ${allRows.length} Bookings`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">{result.imported} bookings imported</p>
                {result.skipped > 0 && (
                  <p className="text-sm text-muted-foreground">{result.skipped} rows skipped</p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-2 text-destructive">Errors ({result.errors.length})</p>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      Row {err.row}: {err.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => handleClose(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
