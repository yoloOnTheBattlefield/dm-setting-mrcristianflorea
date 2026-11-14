// --- Instagram DM Conversations ---

export interface IgConversation {
  _id: string;
  instagram_thread_id: string;
  account_id: string;
  outbound_account_id?: string | null;
  owner_ig_user_id?: string | null;
  lead_id?: string | null;
  outbound_lead_id?: string | null;
  participant_ids: string[];
  participant_usernames: Record<string, string>;
  last_message_at?: string | null;
  created_at: string;
}

export interface IgMessage {
  _id: string;
  conversation_id: string;
  account_id: string;
  outbound_account_id?: string | null;
  direction: "inbound" | "outbound";
  sender_id: string;
  recipient_id: string;
  message_text?: string | null;
  message_id: string;
  timestamp: string;
  read_at?: string | null;
  created_at: string;
}

export interface IgConversationResponse {
  conversation: IgConversation;
  messages: IgMessage[];
  total: number;
  page: number;
  limit: number;
}

// API response type matching your server
export interface ApiLead {
  _id: string;
  account_id: string;
  contact_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  ig_username?: string | null;
  platform?: "instagram" | "linkedin";
  source?: string | null;
  outbound_lead_id?: string | null;
  ig_thread_id?: string | null;
  date_created: string;
  qualified_at: string | null;
  messaged_at?: string | null;
  replied_at?: string | null;
  link_sent_at: string | null;
  booked_at: string | null;
  ghosted_at: string | null;
  disqualified_at?: string | null;
  disqualified_reason?: string | null;
  follow_up_at: string | null;
  summary?: string | null;
  questions_and_answers?: { answer: string; position: number; question: string }[];
  score?: number | null;
  contract_value?: number | null;
  closed_at?: string | null;
  emails?: string[];
  // Agent (Grokbot) fields
  ig_user_id?: string | null;
  zernio_conversation_id?: string | null;
  stage?: AgentStage | null;
  skip?: boolean;
  skip_reason?: string | null;
  language?: "en" | "ro" | null;
  industry?: string | null;
  offer?: string | null;
  buyer?: string | null;
  ticket_size?: string | null;
  monthly_revenue?: string | null;
  monthly_revenue_usd?: number | null;
  pain?: string | null;
  pitch?: PitchInfo | null;
  lead_magnet?: LeadMagnetInfo | null;
  live_until?: string | null;
  last_inbound_at?: string | null;
  last_outbound_at?: string | null;
  last_bot_send_at?: string | null;
  next_booking?: NextBooking | null;
  source_type?: LeadSourceType | null;
  source_label?: string | null;
  source_media_id?: string | null;
  source_url?: string | null;
}

export type LeadSourceType = "story" | "reel" | "post" | "comment" | "organic" | "other";

export type AgentStage =
  | "new"
  | "qualifying"
  | "pain"
  | "teaser"
  | "pitched"
  | "negotiating"
  | "booked"
  | "won"
  | "lost";

export type LeadMagnetStatus = "none" | "posted" | "building" | "built" | "sent";

export interface PitchInfo {
  offer?: "sprint_5k" | "consult_500" | null;
  amount?: number | null;
  counter?: string | null;
  at?: string | null;
}

export interface LeadMagnetInfo {
  status?: LeadMagnetStatus | null;
  brief?: string | null;
  ideas?: string | null;
  doc_url?: string | null;
  slack_posted_at?: string | null;
  sent_at?: string | null;
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
  messagedCount?: number;
  messagedRate?: number;
  repliedCount?: number;
  repliedRate?: number;
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

// --- Sales Metrics ---

export interface SalesSourceMetrics {
  source: string;
  bookings: number;
  completed: number;
  close_rate: number;
  show_up_rate: number;
  revenue: number;
}

export interface SalesMediumMetrics {
  medium: string;
  source: string;
  bookings: number;
  completed: number;
  close_rate: number;
  revenue: number;
}

export interface SalesMetrics {
  total_bookings: number;
  overall_close_rate: number;
  overall_show_up_rate: number;
  total_revenue: number;
  avg_deal_value: number;
  by_source: SalesSourceMetrics[];
  by_medium: SalesMediumMetrics[];
}

// --- Payments ---

export interface Payment {
  _id: string;
  account_id: string;
  lead_id: string | null;
  stripe_event_id: string;
  stripe_event_type: string;
  amount: number; // in cents
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  description: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_date: string;
  createdAt: string;
}

export type DateRangeFilter = 1 | 7 | 14 | 30 | 90 | "all";

export interface TeamMember {
  _id: string;
  user_id: string;
  account_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  has_outbound?: boolean;
  has_research?: boolean;
}

// --- Scrape Jobs ---

export type ScrapeJobStatus =
  | "pending"
  | "collecting_followers"
  | "fetching_bios"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export interface ScrapeJobResults {
  leads_created: number;
  leads_updated: number;
  leads_filtered: number;
  leads_unqualified: number;
  leads_skipped: number;
}

export interface ScrapeJob {
  _id: string;
  account_id: string;
  target_username: string;
  outbound_account_id: string;
  status: ScrapeJobStatus;
  total_followers: number;
  followers_collected: number;
  bios_fetched: number;
  results: ScrapeJobResults;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeJobsResponse {
  jobs: ScrapeJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Deep Scrape Jobs ---

export type DeepScrapeJobStatus =
  | "pending"
  | "scraping_reels"
  | "scraping_comments"
  | "scraping_likers"
  | "scraping_followers"
  | "scraping_profiles"
  | "qualifying"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export interface DeepScrapeJobStats {
  reels_scraped: number;
  comments_scraped: number;
  unique_commenters: number;
  profiles_scraped: number;
  filtered_low_followers: number;
  sent_to_ai: number;
  qualified: number;
  rejected: number;
  skipped_existing: number;
  leads_created: number;
  leads_updated: number;
  likers_scraped: number;
  unique_likers: number;
  followers_scraped: number;
}

export interface DeepScrapeJob {
  _id: string;
  account_id: string;
  name: string | null;
  mode?: "outbound" | "research";
  status: DeepScrapeJobStatus;
  seed_usernames: string[];
  direct_urls?: string[];
  scrape_type: "reels" | "posts";
  scrape_comments: boolean;
  scrape_likers: boolean;
  scrape_followers: boolean;
  reel_limit: number;
  comment_limit: number;
  min_followers: number;
  force_reprocess: boolean;
  promptId: string | null;
  promptLabel: string | null;
  stats: DeepScrapeJobStats;
  is_recurring: boolean;
  repeat_interval_days: number | null;
  next_run_at: string | null;
  parent_job_id: string | null;
  comments_skipped: boolean;
  started_at: string | null;
  completed_at: string | null;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeepScrapeJobsResponse {
  jobs: DeepScrapeJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeepScrapeLogEntry {
  jobId: string;
  message: string;
  level: "info" | "success" | "warn" | "error";
  timestamp: string;
}

export interface DeepScrapeTargetStat {
  seed: string;
  total_scraped: number;
  avg_followers: number;
  qualified: number;
  rejected: number;
  low_followers: number;
  messaged: number;
  replied: number;
  booked: number;
  total_contract_value: number;
  reply_rate: number;
  book_rate: number;
}

export interface DeepScrapeLeadEntry {
  jobId: string;
  username: string;
  fullName: string | null;
  followersCount: number;
  qualified: boolean | null;
  unqualified_reason: string | null;
  bio: string | null;
}

// --- Apify Tokens ---

export type ApifyTokenStatus = "active" | "limit_reached" | "disabled";

export interface ApifyToken {
  _id: string;
  label: string;
  token: string; // masked from API
  status: ApifyTokenStatus;
  last_error: string | null;
  usage_count: number;
  last_used_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "scheduled" | "completed" | "no_show" | "cancelled";

export interface NextBooking {
  start: string;
  end?: string | null;
  status: BookingStatus;
  meeting_url?: string | null;
}

export interface ApiBooking {
  _id: string;
  lead_id?: string | null;
  contact_name?: string | null;
  email?: string | null;
  ig_username?: string | null;
  booking_date: string;
  end_date?: string | null;
  status: BookingStatus;
  provider?: "calendly" | "calcom";
  calcom_uid?: string | null;
  meeting_url?: string | null;
  rescheduled_from_uid?: string | null;
  lead?: { _id: string; first_name?: string; last_name?: string; ig_username?: string | null } | null;
}
