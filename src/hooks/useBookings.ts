import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, fetchWithAuth } from "@/lib/api";

const BASE = `${API_URL}/api/bookings`;

export type BookingStatus = "scheduled" | "completed" | "no_show" | "cancelled";

export interface Booking {
  _id: string;
  account_id: string;
  lead_id: string | null;
  outbound_lead_id: string | null;
  source: "inbound" | "outbound";
  contact_name: string;
  ig_username: string | null;
  email: string | null;
  booking_date: string;
  status: BookingStatus;
  cash_collected: number | null;
  contract_value: number | null;
  notes: string;
  cancelled_at: string | null;
  completed_at: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  outbound_lead?: {
    username: string;
    fullName: string;
    followersCount: number;
  };
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface BookingStats {
  total: number;
  scheduled: number;
  completed: number;
  no_show: number;
  cancelled: number;
  today_count: number;
}

export interface BookingAnalytics {
  total: number;
  close_rate: number;
  show_up_rate: number;
  avg_cash_collected: number;
  over_time: { date: string; count: number }[];
  source_distribution: { source: string; count: number }[];
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useBookings(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sort?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
  today?: boolean;
}) {
  return useQuery({
    queryKey: ["bookings", params.page, params.limit, params.status, params.search, params.sort, params.source, params.start_date, params.end_date, params.today],
    queryFn: async (): Promise<BookingsResponse> => {
      const sp = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
      if (params.status && params.status !== "all") sp.append("status", params.status);
      if (params.search?.trim()) sp.append("search", params.search.trim());
      if (params.sort) sp.append("sort", params.sort);
      if (params.source) sp.append("source", params.source);
      if (params.start_date) sp.append("start_date", params.start_date);
      if (params.end_date) sp.append("end_date", params.end_date);
      if (params.today) sp.append("today", "true");
      const res = await fetchWithAuth(`${BASE}?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    staleTime: 1000 * 15,
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: ["booking-stats"],
    queryFn: async (): Promise<BookingStats> => {
      const res = await fetchWithAuth(`${BASE}/stats`);
      if (!res.ok) throw new Error("Failed to fetch booking stats");
      return res.json();
    },
    staleTime: 1000 * 15,
  });
}

export function useBookingAnalytics(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ["booking-analytics", params?.start_date, params?.end_date],
    queryFn: async (): Promise<BookingAnalytics> => {
      const sp = new URLSearchParams();
      if (params?.start_date) sp.append("start_date", params.start_date);
      if (params?.end_date) sp.append("end_date", params.end_date);
      const url = sp.toString() ? `${BASE}/analytics?${sp.toString()}` : `${BASE}/analytics`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Failed to fetch booking analytics");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async (): Promise<Booking> => {
      const res = await fetchWithAuth(`${BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch booking");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Booking> & { booking_date: string }) => {
      const res = await fetchWithAuth(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const res = await fetchWithAuth(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
      qc.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`${BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete booking");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
    },
  });
}

export function useImportBookings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]): Promise<{ imported: number; skipped: number; errors: { row: number; reason: string }[] }> => {
      const res = await fetchWithAuth(`${BASE}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) throw new Error("Failed to import bookings");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
      qc.invalidateQueries({ queryKey: ["booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useSyncBookings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ synced: number }> => {
      const res = await fetchWithAuth(`${BASE}/sync`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync bookings");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
    },
  });
}
