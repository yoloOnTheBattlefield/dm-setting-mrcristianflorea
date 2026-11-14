import type { AgentStage, ApiLead, LeadMagnetStatus } from "@/lib/types";

export const AGENT_STAGES: AgentStage[] = [
  "new",
  "qualifying",
  "pain",
  "teaser",
  "pitched",
  "negotiating",
  "booked",
  "won",
  "lost",
];

export const STAGE_LABELS: Record<AgentStage, string> = {
  new: "New",
  qualifying: "Qualifying",
  pain: "Pain / goal",
  teaser: "Teaser",
  pitched: "Pitched",
  negotiating: "Negotiating",
  booked: "Call booked",
  won: "Won",
  lost: "Lost",
};

export const LEAD_MAGNET_STATUSES: LeadMagnetStatus[] = ["none", "posted", "building", "built", "sent"];

export const LEAD_MAGNET_LABELS: Record<LeadMagnetStatus, string> = {
  none: "None",
  posted: "To build",
  building: "Building",
  built: "Built",
  sent: "Sent",
};

export const PITCH_OFFER_LABELS: Record<string, string> = {
  sprint_5k: "$5k sprint",
  consult_500: "$500 consult",
};

export function stageLabel(stage?: string | null): string {
  if (!stage) return STAGE_LABELS.new;
  return STAGE_LABELS[stage as AgentStage] ?? stage;
}

export function leadMagnetLabel(status?: string | null): string {
  if (!status) return LEAD_MAGNET_LABELS.none;
  return LEAD_MAGNET_LABELS[status as LeadMagnetStatus] ?? status;
}

/** The ref the agent API accepts for a lead: IG user id, else @handle, else the zernio conversation id. */
export function contactRef(lead: Pick<ApiLead, "ig_user_id" | "ig_username" | "zernio_conversation_id">): string | null {
  if (lead.ig_user_id) return lead.ig_user_id;
  if (lead.ig_username) return `@${lead.ig_username.replace(/^@/, "")}`;
  if (lead.zernio_conversation_id) return lead.zernio_conversation_id;
  return null;
}
