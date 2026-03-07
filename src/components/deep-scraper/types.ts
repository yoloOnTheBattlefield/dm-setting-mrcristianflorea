export interface TargetStat {
  seed: string;
  total_scraped: number;
  avg_followers: number;
  qualified: number;
  rejected: number;
  messaged: number;
  replied: number;
  reply_rate: number;
  booked: number;
  book_rate: number;
  total_contract_value: number;
}

export interface TargetStatWithQual extends TargetStat {
  qualRate: number | null;
  isLowFit: boolean;
}

export interface Prompt {
  _id: string;
  label: string;
}
