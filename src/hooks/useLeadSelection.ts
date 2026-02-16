import { useState, useCallback } from "react";

type Mode = "manual" | "select-all";

export function useLeadSelection() {
  const [mode, setMode] = useState<Mode>("manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string): boolean => {
      if (mode === "manual") return selectedIds.has(id);
      return !excludedIds.has(id);
    },
    [mode, selectedIds, excludedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      if (mode === "manual") {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      } else {
        setExcludedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    },
    [mode]
  );

  const toggleAll = useCallback(
    (currentPageIds: string[]) => {
      if (mode === "manual") {
        const allSelected = currentPageIds.every((id) => selectedIds.has(id));
        if (allSelected) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            currentPageIds.forEach((id) => next.delete(id));
            return next;
          });
        } else {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            currentPageIds.forEach((id) => next.add(id));
            return next;
          });
        }
      } else {
        const allExcluded = currentPageIds.every((id) => excludedIds.has(id));
        if (allExcluded) {
          setExcludedIds((prev) => {
            const next = new Set(prev);
            currentPageIds.forEach((id) => next.delete(id));
            return next;
          });
        } else {
          setExcludedIds((prev) => {
            const next = new Set(prev);
            currentPageIds.forEach((id) => next.add(id));
            return next;
          });
        }
      }
    },
    [mode, selectedIds, excludedIds]
  );

  const selectAllMatching = useCallback(() => {
    setMode("select-all");
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setMode("manual");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, []);

  const getCount = useCallback(
    (totalMatching: number): number => {
      if (mode === "manual") return selectedIds.size;
      return totalMatching - excludedIds.size;
    },
    [mode, selectedIds.size, excludedIds.size]
  );

  return {
    mode,
    selectedIds,
    excludedIds,
    toggle,
    toggleAll,
    selectAllMatching,
    clearSelection,
    getCount,
    isSelected,
  };
}
