export interface LeadListFilters {
  status?: string[];
  start_date?: string;
  end_date?: string;
  search?: string;
  account_id?: string;
  exclude_linked?: boolean;
}

export interface ManualBulkDeletePayload {
  ids: string[];
}

export interface SelectAllBulkDeletePayload {
  all: true;
  filters: LeadListFilters;
  exclude_ids: string[];
}

export type BulkDeletePayload = ManualBulkDeletePayload | SelectAllBulkDeletePayload;

/**
 * Builds the POST /leads/bulk-delete body for the contacts list.
 *
 * In "select-all" mode the client must NOT send an id list: it only holds the
 * current page of leads, so sending ids would delete a page-sized slice of the
 * N leads the user selected. Instead the server re-runs the list filters and
 * deletes everything they match, minus the rows the user unchecked.
 */
export function buildBulkDeletePayload(
  mode: "manual" | "select-all",
  selectedIds: Set<string>,
  excludedIds: Set<string>,
  filters: LeadListFilters
): BulkDeletePayload {
  if (mode === "select-all") {
    return {
      all: true,
      filters,
      exclude_ids: Array.from(excludedIds),
    };
  }
  return { ids: Array.from(selectedIds) };
}

export function isSelectAllPayload(
  payload: BulkDeletePayload
): payload is SelectAllBulkDeletePayload {
  return "all" in payload;
}
