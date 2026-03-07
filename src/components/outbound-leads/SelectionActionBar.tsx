import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionActionBarProps {
  selectedIds: Set<string>;
  selectAll: boolean;
  setSelectAll: (value: boolean) => void;
  setSelectedIds: (ids: Set<string>) => void;
  leads: { _id: string }[];
  pagination: { total: number } | undefined;
  isDeleting: boolean;
  handleBulkDelete: () => void;
}

export default function SelectionActionBar({
  selectedIds,
  selectAll,
  setSelectAll,
  setSelectedIds,
  leads,
  pagination,
  isDeleting,
  handleBulkDelete,
}: SelectionActionBarProps) {
  if (selectedIds.size === 0 && !selectAll) return null;

  return (
    <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-muted/50 border">
      <span className="text-sm">
        {selectAll
          ? `All ${pagination?.total ?? 0} leads selected`
          : `${selectedIds.size} selected`}
      </span>
      {!selectAll &&
        selectedIds.size === leads.length &&
        pagination &&
        pagination.total > leads.length && (
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={() => setSelectAll(true)}
          >
            Select all {pagination.total} matching leads
          </Button>
        )}
      {selectAll && (
        <Button
          variant="link"
          size="sm"
          className="text-xs h-auto p-0"
          onClick={() => {
            setSelectAll(false);
            setSelectedIds(new Set(leads.map((l) => l._id)));
          }}
        >
          Select this page only
        </Button>
      )}
      <div className="ml-auto">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {isDeleting
            ? "Deleting..."
            : `Delete ${selectAll ? (pagination?.total ?? 0) : selectedIds.size}`}
        </Button>
      </div>
    </div>
  );
}
