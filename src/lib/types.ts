export interface Contact {
  contactId: string;
  name: string;
  dateCreated: string;
  qualifiedDate: string | null;
  bookedDate: string | null;
  ghostedDate: string | null;
  fupDate: string | null;
}

export interface FunnelMetrics {
  totalContacts: number;
  qualifiedCount: number;
  qualificationRate: number;
  bookedCount: number;
  bookingRate: number;
  ghostedCount: number;
  ghostRate: number;
  fupCount: number;
  fupToBookedCount: number;
  recoveryRate: number;
}

export interface VelocityMetrics {
  createdToQualified: { median: number; average: number };
  qualifiedToBooked: { median: number; average: number };
  createdToGhosted: { median: number; average: number };
}

export interface DailyVolume {
  date: string;
  created: number;
  qualified: number;
  booked: number;
  ghosted: number;
}

export interface GhostingBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export interface FupEffectiveness {
  totalFup: number;
  convertedToBooked: number;
  conversionRate: number;
  remainingInactive: number;
  inactiveRate: number;
}

export interface StageAging {
  stage: string;
  contacts: { name: string; daysSinceAction: number }[];
  count: number;
}

export interface CumulativeBooking {
  date: string;
  cumulative: number;
}

export type DateRangeFilter = 7 | 14 | 30;
