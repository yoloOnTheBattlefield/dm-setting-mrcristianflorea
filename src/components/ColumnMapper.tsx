import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, ArrowRight } from "lucide-react";
import {
  MAPPABLE_FIELDS,
  IDENTIFIER_FIELDS,
  autoSuggestMapping,
  validateMapping,
  type ColumnMapping,
  type MappableFieldKey,
} from "@/lib/column-mapping";

interface ColumnMapperProps {
  headers: string[];
  previewRows: Record<string, unknown>[];
  onConfirm: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export default function ColumnMapper({
  headers,
  previewRows,
  onConfirm,
  onBack,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() =>
    autoSuggestMapping(headers),
  );

  const validation = useMemo(() => validateMapping(mapping), [mapping]);

  const usedFields = useMemo(() => {
    const set = new Set<MappableFieldKey>();
    for (const val of Object.values(mapping)) {
      if (val) set.add(val);
    }
    return set;
  }, [mapping]);

  const handleFieldChange = (header: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: value === "__ignore__" ? null : (value as MappableFieldKey),
    }));
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">{headers.length} columns</Badge>
        <Badge variant="secondary">{mappedCount} mapped</Badge>
        <Badge variant="outline">
          {headers.length - mappedCount} ignored
        </Badge>
      </div>

      {!validation.valid && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validation.error}
        </div>
      )}

      <div className="rounded-md border max-h-[calc(100vh-280px)] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Spreadsheet Column</TableHead>
              <TableHead className="w-[40px]" />
              <TableHead className="w-[180px]">Maps To</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header) => {
              const currentValue = mapping[header];
              return (
                <TableRow key={header}>
                  <TableCell className="font-mono text-xs">{header}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentValue ?? "__ignore__"}
                      onValueChange={(v) => handleFieldChange(header, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ignore__">
                          <span className="text-muted-foreground">
                            -- Ignore --
                          </span>
                        </SelectItem>
                        {MAPPABLE_FIELDS.map((field) => {
                          const isUsedElsewhere =
                            usedFields.has(field.key) &&
                            currentValue !== field.key;
                          return (
                            <SelectItem
                              key={field.key}
                              value={field.key}
                              disabled={isUsedElsewhere}
                            >
                              {field.label}
                              {IDENTIFIER_FIELDS.includes(field.key)
                                ? " *"
                                : ""}
                              {isUsedElsewhere ? " (used)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {previewRows[0]
                      ? String(previewRows[0][header] ?? "")
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Fields marked with * are identifiers. At least one must be mapped.
      </p>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => onConfirm(mapping)}
          disabled={!validation.valid}
        >
          <Check className="h-4 w-4 mr-1.5" />
          Confirm & Import
        </Button>
      </div>
    </div>
  );
}
