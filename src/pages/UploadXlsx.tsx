import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/api/upload-xlsx"
  : "https://quddify-server.vercel.app/api/upload-xlsx";

const FILENAME_REGEX = /^(follower|following)-of-(.+)-(\d{8})\.xlsx$/;

interface UploadResult {
  totalRowsParsed: number;
  filteredRows: number;
  qualifiedInsertedCount: number;
  sourceAccount: string;
  scrapeDate: string;
}

function parseFilename(name: string) {
  const match = name.match(FILENAME_REGEX);
  if (!match) return null;
  const type = match[1]; // "follower" or "following"
  const account = match[2];
  const dateStr = match[3]; // YYYYMMDD
  const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  return { type, account, date: formattedDate };
}

export default function UploadXlsx() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.endsWith(".xlsx")) {
        toast({ title: "Invalid file", description: "Only .xlsx files are accepted", variant: "destructive" });
        return;
      }
      if (!FILENAME_REGEX.test(f.name)) {
        toast({
          title: "Invalid filename",
          description: "Filename must match: follower-of-{account}-{YYYYMMDD}.xlsx or following-of-{account}-{YYYYMMDD}.xlsx",
          variant: "destructive",
        });
        return;
      }
      setFile(f);
      setResult(null);
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data: UploadResult = await response.json();
        setResult(data);
        setFile(null);
        toast({ title: "Success", description: `${data.qualifiedInsertedCount} qualified profiles inserted` });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Upload failed", description: data.error || `Server error: ${response.status}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const parsed = file ? parseFilename(file.name) : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold tracking-tight">Upload XLSX</h2>
      <p className="text-sm text-muted-foreground -mt-2">
        Upload IG scraper exports to qualify and import profiles
      </p>

      {/* Drop zone */}
      <Card
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
            <p className="text-sm font-medium">Drop your .xlsx file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              follower-of-&#123;account&#125;-&#123;YYYYMMDD&#125;.xlsx or following-of-&#123;account&#125;-&#123;YYYYMMDD&#125;.xlsx
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {/* Selected file preview */}
      {file && parsed && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-stage-booked" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{parsed.type}</Badge>
                  <Badge variant="outline">@{parsed.account}</Badge>
                  <Badge variant="outline">{parsed.date}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUploading}>
                Clear
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-stage-booked" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Rows Parsed</p>
                <p className="text-lg font-semibold">{result.totalRowsParsed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passed Filters</p>
                <p className="text-lg font-semibold">{result.filteredRows}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qualified & Inserted</p>
                <p className="text-lg font-semibold text-stage-booked">{result.qualifiedInsertedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-lg font-semibold">@{result.sourceAccount}</p>
                <p className="text-xs text-muted-foreground">{result.scrapeDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
