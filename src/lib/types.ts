// API response type matching your server
export interface ApiLead {
  _id: string;
  account_id: string;
  contact_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  date_created: string;
  qualified_at: string | null;
  link_sent_at: string | null;
  booked_at: string | null;
  ghosted_at: string | null;
  follow_up_at: string | null;
  summary?: string | null;
  questions_and_answers?: { answer: string; position: number; question: string }[];
  score?: number | null;
  contract_value?: number | null;
  closed_at?: string | null;
}

// Internal contact type used by analytics
export interface Contact {
  contactId: string;
  name: string;
  dateCreated: string;
  bookedDate: string | null;
  ghostedDate: string | null;
  fupDate: string | null;
}

// Transform API lead to internal Contact format
export function transformApiLead(lead: ApiLead): Contact {
  return {
    contactId: lead.contact_id,
    name: `${lead.first_name} ${lead.last_name}`.trim(),
    dateCreated: lead.date_created,
    bookedDate: lead.booked_at,
    ghostedDate: lead.ghosted_at,
    fupDate: lead.follow_up_at,
  };
}

export interface FunnelMetrics {
  totalContacts: number;
  linkSentCount: number;
  linkSentRate: number;
  linkClickedCount: number;
  linkClickedRate: number;
  bookedCount: number;
  bookingRate: number;
  ghostedCount: number;
  ghostRate: number;
  fupCount: number;
  fupToBookedCount: number;
  recoveryRate: number;
  // Outbound
  obMessaged: number;
  obReplied: number;
  obBooked: number;
  obQualified: number;
  obContracts: number;
  obContractValue: number;
  obReplyRate: number;
  obBookRate: number;
  obCloseRate: number;
  // Combined
  combinedContacts: number;
  combinedBooked: number;
  combinedBookedRate: number;
}

export interface VelocityMetrics {
  createdToLinkSent: { median: number; average: number };
  linkSentToBooked: { median: number; average: number };
  createdToGhosted: { median: number; average: number };
}

export interface DailyVolume {
  date: string;
  created: number;
  link_sent: number;
  booked: number;
  ghosted: number;
  ob_messaged: number;
  ob_replied: number;
  ob_booked: number;
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
  ob_cumulative: number;
  combined_cumulative: number;
}

export type SourceFilter = "all" | "inbound" | "outbound";

export type DateRangeFilter = 1 | 7 | 14 | 30 | 90 | "all";

export interface TeamMember {
  _id: string;
  account_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  has_outbound?: boolean;
  ghl?: string;
}
