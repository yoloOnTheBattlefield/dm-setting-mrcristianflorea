import { useQuery } from "@tanstack/react-query";
import { API_URL, apiGet } from "@/lib/api";
import type { ApiBooking } from "@/lib/types";

const BASE = `${API_URL}/api/bookings`;

interface BookingsResponse {
  bookings: ApiBooking[];
}

function bookingLeadId(b: ApiBooking): string | null {
  return b.lead_id ? String(b.lead_id) : b.lead?._id ? String(b.lead._id) : null;
}

export function useUpcomingCalls(limit = 5) {
  return useQuery({
    queryKey: ["bookings", "upcoming", limit],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiGet<BookingsResponse>(
        `${BASE}?status=scheduled&start_date=${today}&sort=booking_date&limit=100`,
      );
      const now = Date.now();
      return (res.bookings ?? [])
        .filter((b) => new Date(b.booking_date).getTime() >= now)
        .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
        .slice(0, limit);
    },
  });
}

export function useLeadBookings(leadId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", "lead", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const res = await apiGet<BookingsResponse>(`${BASE}?status=all&sort=booking_date&limit=100`);
      return (res.bookings ?? []).filter((b) => bookingLeadId(b) === leadId);
    },
  });
}

export { bookingLeadId };
