export type ConstraintType =
  | "delegation"
  | "psychological"
  | "conversion"
  | "content"
  | "systems"
  | "ads";

export type ClientHealth = "green" | "amber" | "red";
export type ClientStatus = "active" | "paused" | "churned";

export interface AdvisoryClient {
  _id: string;
  account_id: string;
  name: string;
  niche: string;
  monthly_revenue: number;
  runway: number;
  constraint_type: ConstraintType;
  status: ClientStatus;
  health: ClientHealth;
  next_call_date?: string;
  notes?: string;
  latest_session?: AdvisorySession;
  latest_metric?: AdvisoryMetric;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  _id: string;
  task: string;
  owner: string;
  due_date?: string;
  completed: boolean;
}

export interface AdvisorySession {
  _id: string;
  account_id: string;
  client_id: string;
  session_date: string;
  fathom_url?: string;
  bottleneck_identified?: string;
  summary?: string;
  action_items: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdvisoryMetric {
  _id: string;
  account_id: string;
  client_id: string;
  month: string;
  cash_collected: number;
  mrr: number;
  calls_booked: number;
  calls_showed: number;
  calls_closed: number;
  expenses: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorySummary {
  total_mrr: number;
  total_cash_collected: number;
  avg_show_rate: number;
  avg_close_rate: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
