import { useParams, Link, useNavigate } from "react-router-dom";
import { formatShortDate, formatAbsoluteDateTime, timeAgo } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Instagram,
  Mail,
  Globe,
  Users,
  FileText,
  StickyNote,
  Trash2,
  Send,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Link2,
  MessageCircle,
  CalendarCheck,
  XCircle,
  Star,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";
import {
  useOutboundLeadDetail,
  useUpdateOutboundLead,
  type OutboundLeadDetail as OutboundLeadDetailType,
} from "@/hooks/useOutboundLeadDetail";
import { useLeadConversation } from "@/hooks/useLeadConversation";
import {
  useOutboundLeadNotes,
  useCreateOutboundLeadNote,
  useDeleteLeadNote,
} from "@/hooks/useLeadNotes";

// ── Helpers ──

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts[0]?.length) return parts[0][0].toUpperCase();
  return "?";
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Pipeline stages for outbound leads
const PIPELINE_STAGES = [
  { key: "new", label: "New", icon: FileText, bg: "bg-slate-500", text: "text-slate-500" },
  { key: "messaged", label: "Messaged", icon: Send, bg: "bg-amber-500", text: "text-amber-500" },
  { key: "replied", label: "Replied", icon: MessageCircle, bg: "bg-blue-500", text: "text-blue-500" },
  { key: "link_sent", label: "Link Sent", icon: Link2, bg: "bg-cyan-500", text: "text-cyan-500" },
  { key: "booked", label: "Booked", icon: CalendarCheck, bg: "bg-emerald-500", text: "text-emerald-500" },
] as const;

function getCurrentStageIndex(lead: OutboundLeadDetailType): number {
  if (lead.qualified === false) return -1; // DQ
  if (lead.booked) return 4;
  if (lead.link_sent) return 3;
  if (lead.replied) return 2;
  if (lead.isMessaged) return 1;
  return 0;
}

function getScoreInfo(score: number | null | undefined) {
  if (score == null) return { label: "—", bgClass: "bg-muted", textClass: "text-muted-foreground" };
  if (score >= 7) return { label: `${score}/10`, bgClass: "bg-emerald-100 dark:bg-emerald-950", textClass: "text-emerald-700 dark:text-emerald-400" };
  if (score >= 4) return { label: `${score}/10`, bgClass: "bg-amber-100 dark:bg-amber-950", textClass: "text-amber-700 dark:text-amber-400" };
  return { label: `${score}/10`, bgClass: "bg-red-100 dark:bg-red-950", textClass: "text-red-700 dark:text-red-400" };
}

// ── Main component ──

export default function OutboundLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading, error } = useOutboundLeadDetail(id);
  const updateLead = useUpdateOutboundLead();
  const conversationQuery = useLeadConversation(id);
  const conversationData = conversationQuery.data;
  const { data: notes } = useOutboundLeadNotes(id);
  const createNote = useCreateOutboundLeadNote();
  const deleteNote = useDeleteLeadNote();

  const [noteText, setNoteText] = useState("");
  const [contractInput, setContractInput] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveNote = useCallback(() => {
    if (!id || !noteText.trim()) return;
    createNote.mutate(
      { outbound_lead_id: id, content: noteText.trim() },
      {
        onSuccess: () => {
          setNoteText("");
          toast({ title: "Note added" });
        },
      }
    );
  }, [id, noteText, createNote, toast]);

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (!id) return;
      deleteNote.mutate({ id: noteId, lead_id: id });
    },
    [id, deleteNote]
  );

  const handleSaveContractValue = useCallback(
    (value: string) => {
      if (!id) return;
      const num = value ? Number(value) : null;
      updateLead.mutate({ id, data: { contract_value: num } });
      setContractInput(null);
    },
    [id, updateLead]
  );

  const handleToggleStage = useCallback(
    (field: "isMessaged" | "replied" | "link_sent" | "booked") => {
      if (!id || !lead) return;
      updateLead.mutate({ id, data: { [field]: !lead[field] } });
    },
    [id, lead, updateLead]
  );

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="outline" onClick={() => navigate("/outbound-leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const displayName = lead.fullName || lead.username;
  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);
  const stageIndex = getCurrentStageIndex(lead);
  const scoreInfo = getScoreInfo(lead.score);
  const isDQ = lead.qualified === false;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {/* Back nav */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/outbound-leads">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className={cn("h-14 w-14 text-white", avatarColor)}>
            <AvatarFallback className={cn("text-lg font-semibold text-white", avatarColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              {lead.isVerified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
              {isDQ && (
                <Badge variant="destructive" className="text-xs">Disqualified</Badge>
              )}
              {lead.score != null && (
                <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", scoreInfo.bgClass, scoreInfo.textClass)}>
                  {scoreInfo.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
              <a
                href={lead.profileLink || `https://instagram.com/${lead.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Instagram className="h-3.5 w-3.5" />
                @{lead.username}
              </a>
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </span>
              )}
              <span>Added {formatShortDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Pipeline stepper */}
        {!isDQ && (
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const isActive = i <= stageIndex;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center gap-1 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (stage.key === "messaged") handleToggleStage("isMessaged");
                      else if (stage.key === "replied") handleToggleStage("replied");
                      else if (stage.key === "link_sent") handleToggleStage("link_sent");
                      else if (stage.key === "booked") handleToggleStage("booked");
                    }}
                    disabled={stage.key === "new"}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? `${stage.bg} text-white`
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                      stage.key === "new" && "cursor-default"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{stage.label}</span>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className={cn("h-0.5 flex-1", i < stageIndex ? stage.bg : "bg-muted")} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact info */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Instagram</span>
                  <a
                    href={lead.profileLink || `https://instagram.com/${lead.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-foreground hover:underline"
                  >
                    @{lead.username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {lead.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lead.email!);
                        toast({ title: "Copied" });
                      }}
                      className="flex items-center gap-1 text-foreground hover:underline"
                    >
                      {lead.email}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {lead.externalUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Website</span>
                    <a href={lead.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-foreground hover:underline truncate max-w-[150px]">
                      <Globe className="h-3 w-3 shrink-0" />
                      {new URL(lead.externalUrl).hostname}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatNumber(lead.followersCount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posts</span>
                  <span>{formatNumber(lead.postsCount)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline">@{lead.source}</Badge>
                </div>

                {lead.promptLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prompt</span>
                    <Badge variant="outline">{lead.promptLabel}</Badge>
                  </div>
                )}

                {lead.dmDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">DM Sent</span>
                    <span>{formatShortDate(lead.dmDate)}</span>
                  </div>
                )}

                {lead.replied_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Replied</span>
                    <span>{formatShortDate(lead.replied_at)}</span>
                  </div>
                )}

                {lead.booked_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Booked</span>
                    <span>{formatShortDate(lead.booked_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bio */}
            {lead.bio && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bio
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm whitespace-pre-line">{lead.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Deal */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Deal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                {lead.score != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">AI Score</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span className={cn("font-medium", scoreInfo.textClass)}>
                        {scoreInfo.label}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contract Value</span>
                  {contractInput !== null ? (
                    <Input
                      type="number"
                      className="w-24 h-7 text-xs"
                      autoFocus
                      value={contractInput}
                      onChange={(e) => setContractInput(e.target.value)}
                      onBlur={() => handleSaveContractValue(contractInput)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveContractValue(contractInput);
                        if (e.key === "Escape") setContractInput(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setContractInput(lead.contract_value?.toString() ?? "")}
                      className="font-medium hover:underline"
                    >
                      {lead.contract_value != null ? `$${lead.contract_value.toLocaleString()}` : "—"}
                    </button>
                  )}
                </div>

                {lead.ai_processed && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">AI Processed</span>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {lead.ai_model || lead.ai_provider || "Yes"}
                    </Badge>
                  </div>
                )}

                {lead.unqualified_reason && (
                  <div>
                    <span className="text-muted-foreground text-xs">DQ Reason</span>
                    <p className="text-sm mt-0.5">{lead.unqualified_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Note composer */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    ref={noteRef}
                    placeholder="Add a note…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSaveNote();
                      }
                    }}
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={!noteText.trim() || createNote.isPending}
                    className="self-end"
                  >
                    {createNote.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <StickyNote className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* DM Conversation */}
            {conversationData?.messages && conversationData.messages.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    DM Conversation
                    <span className="ml-auto font-normal normal-case text-muted-foreground/60">
                      {conversationData.total} message{conversationData.total !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                    {conversationData.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.direction === "outbound" ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 text-sm",
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                        >
                          {msg.message_text || <span className="italic opacity-60">Media</span>}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1 cursor-default">
                              {timeAgo(msg.timestamp)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{formatAbsoluteDateTime(msg.timestamp)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  {conversationData.total > conversationData.messages.length && (
                    <p className="text-xs text-muted-foreground/60 text-center mt-2">
                      Showing {conversationData.messages.length} of {conversationData.total} messages
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GHL AI Conversation (from linked inbound lead) */}
            {lead?.inbound_lead?.ghl_messages && lead.inbound_lead.ghl_messages.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    GHL AI Conversation
                    <span className="ml-auto font-normal normal-case text-muted-foreground/60">
                      {lead.inbound_lead.ghl_messages.length} message{lead.inbound_lead.ghl_messages.length !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                    {lead.inbound_lead.ghl_messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.direction === "outbound" ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 text-sm",
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                        >
                          {msg.message_text}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No conversation state */}
            {!conversationQuery.isLoading && (!conversationData?.messages || conversationData.messages.length === 0) && !lead?.inbound_lead?.ghl_messages?.length && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No conversation yet
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {notes && notes.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" />
                    Notes
                    <span className="ml-auto font-normal normal-case text-muted-foreground/60">
                      {notes.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {[...notes].reverse().map((note) => (
                      <div
                        key={note._id}
                        className="group relative rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {note.author_name} · {timeAgo(note.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note._id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
