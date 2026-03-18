import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  DollarSign,
  Star,
  CheckCircle,
  Link2,
  Unlink,
  Search,
  Loader2,
  Instagram,
  Mail,
  Clock,
  FileText,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBoldSectionsToObject(str: string) {
  const regex = /<b>(.*?)<\/b>\s*([\s\S]*?)(?=<b>|$)/g;
  const obj: Record<string, string> = {};

  let match;
  while ((match = regex.exec(str)) !== null) {
    const key = match[1].trim();
    const value = match[2]
      .replace(/\n+/g, "\n")
      .trim();

    obj[key] = value;
  }

  return obj;
}

function SummarySections({ html }: { html: string }) {
  const sections = parseBoldSectionsToObject(html);
  const entries = Object.entries(sections);

  if (entries.length === 0) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([title, content]) => (
        <div
          key={title}
          className="rounded-lg border bg-muted/30 p-4 space-y-1"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h4>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {String(content)}
          </p>
        </div>
      ))}
    </div>
  );
}

async function fetchLead(contactId: string): Promise<ApiLead> {
  const response = await fetchWithAuth(`${API_URL}/leads/${contactId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch lead: ${response.status}`);
  }

  const data: ApiLead = await response.json();
  return data;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLeadStatus(lead: ApiLead): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
} {
  if (lead.booked_at)
    return {
      label: "Converted",
      variant: "default",
      color: "bg-emerald-500 text-white hover:bg-emerald-500",
    };
  if (lead.ghosted_at)
    return {
      label: "Ghosted",
      variant: "destructive",
      color: "bg-red-500 text-white hover:bg-red-500",
    };
  if (lead.follow_up_at)
    return {
      label: "Follow Up",
      variant: "secondary",
      color: "bg-amber-500 text-white hover:bg-amber-500",
    };
  if (lead.link_sent_at)
    return {
      label: "Link Sent",
      variant: "secondary",
      color: "bg-blue-500 text-white hover:bg-blue-500",
    };
  return {
    label: "New",
    variant: "outline",
    color: "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
  };
}

function getInitials(first: string, last: string): string {
  return `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?";
}

// ---------------------------------------------------------------------------
// OutboundLeadLinker
// ---------------------------------------------------------------------------

interface OutboundLeadResult {
  _id: string;
  username: string;
  fullName: string;
  followersCount?: number;
}

function OutboundLeadLinker({
  leadId,
  outboundLeadId,
  leadName,
  onLinked,
}: {
  leadId: string;
  outboundLeadId?: string | null;
  leadName: string;
  onLinked: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<OutboundLeadResult[]>([]);
  const [autoResults, setAutoResults] = useState<OutboundLeadResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkedLead, setLinkedLead] = useState<OutboundLeadResult | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch linked outbound lead details
  useEffect(() => {
    if (!outboundLeadId) {
      setLinkedLead(null);
      return;
    }
    fetchWithAuth(`${API_URL}/outbound-leads/${outboundLeadId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLinkedLead(data);
      });
  }, [outboundLeadId]);

  // Auto-search by lead name on mount when not already linked
  useEffect(() => {
    if (outboundLeadId || autoSearched || leadName.trim().length < 2) return;
    setAutoSearched(true);
    const sp = new URLSearchParams({
      search: leadName.trim(),
      limit: "5",
      page: "1",
    });
    fetchWithAuth(`${API_URL}/outbound-leads?${sp}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.leads?.length) setAutoResults(data.leads);
      });
  }, [outboundLeadId, leadName, autoSearched]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchOutbound = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const sp = new URLSearchParams({
        search: q.trim(),
        limit: "10",
        page: "1",
      });
      const res = await fetchWithAuth(`${API_URL}/outbound-leads?${sp}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.leads || []);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchOutbound(val), 300);
  };

  const linkOutbound = async (outboundId: string) => {
    setIsLinking(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outbound_lead_id: outboundId }),
      });
      if (res.ok) {
        toast({
          title: "Linked",
          description: "Inbound lead linked to outbound lead.",
        });
        setSearch("");
        setResults([]);
        setAutoResults([]);
        setShowResults(false);
        onLinked();
      } else {
        toast({
          title: "Error",
          description: "Failed to link leads",
          variant: "destructive",
        });
      }
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkOutbound = async () => {
    setIsLinking(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outbound_lead_id: null }),
      });
      if (res.ok) {
        toast({ title: "Unlinked", description: "Outbound lead unlinked." });
        setLinkedLead(null);
        onLinked();
      } else {
        toast({
          title: "Error",
          description: "Failed to unlink",
          variant: "destructive",
        });
      }
    } finally {
      setIsLinking(false);
    }
  };

  if (outboundLeadId && linkedLead) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-medium">@{linkedLead.username}</p>
            <p className="text-xs text-muted-foreground">
              {linkedLead.fullName}
              {linkedLead.followersCount != null &&
                ` · ${linkedLead.followersCount.toLocaleString()} followers`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={unlinkOutbound}
          disabled={isLinking}
        >
          <Unlink className="h-3.5 w-3.5 mr-1.5" />
          Unlink
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Auto-matched suggestions */}
      {autoResults.length > 0 && !dismissed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Possible match{autoResults.length > 1 ? "es" : ""} found for "
              {leadName}"
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
          <div className="space-y-1">
            {autoResults.map((ob) => (
              <div
                key={ob._id}
                className="flex items-center justify-between rounded-md bg-white dark:bg-background border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">@{ob.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {ob.fullName}
                    {ob.followersCount != null &&
                      ` · ${ob.followersCount.toLocaleString()} followers`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => linkOutbound(ob._id)}
                  disabled={isLinking}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no auto-results and no search */}
      {autoResults.length === 0 && !search && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
          <Link2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            No outbound lead linked — search below to connect one.
          </p>
        </div>
      )}

      {/* Manual search */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search outbound leads by username or name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() =>
              search.trim().length >= 2 && setShowResults(true)
            }
            className="pl-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
            {results.map((ob) => (
              <button
                key={ob._id}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => linkOutbound(ob._id)}
                disabled={isLinking}
              >
                <div>
                  <p className="text-sm font-medium">@{ob.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {ob.fullName}
                    {ob.followersCount != null &&
                      ` · ${ob.followersCount.toLocaleString()} followers`}
                  </p>
                </div>
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
        {showResults &&
          search.trim().length >= 2 &&
          !isSearching &&
          results.length === 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
              No outbound leads found
            </div>
          )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeadDetail
// ---------------------------------------------------------------------------

export default function LeadDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contractInput, setContractInput] = useState("");

  const {
    data: lead,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lead", contactId],
    queryFn: () => fetchLead(contactId!),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const handleMarkAsBooked = async () => {
    if (!contactId) return;

    setIsBooking(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/leads/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booked_at: new Date().toISOString() }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["lead", contactId] });
        toast({ title: "Success", description: "Lead marked as converted." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to update lead",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const patchLead = async (
    body: Record<string, unknown>,
    successMsg: string
  ) => {
    if (!contactId) return;
    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/leads/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["lead", contactId] });
        toast({ title: "Success", description: successMsg });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to update lead",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading / Error / Not Found states
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load lead</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Lead not found</h2>
          <p className="text-muted-foreground">
            The lead you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const status = getLeadStatus(lead);
  const leadName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/contacts/all">Leads</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{leadName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Profile Header Card ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-14 w-14 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(lead.first_name, lead.last_name)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  {leadName}
                </h1>
                <Badge className={cn("text-xs", status.color)}>
                  {status.label}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {lead.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {lead.email}
                  </span>
                )}
                {lead.ig_username && (
                  <a
                    href={`https://instagram.com/${lead.ig_username.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    @{lead.ig_username.replace(/^@/, "")}
                  </a>
                )}
                {lead.source && (
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {lead.source}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatShortDate(lead.date_created)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!lead.booked_at && (
                <Button
                  onClick={handleMarkAsBooked}
                  disabled={isBooking}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CalendarCheck className="h-4 w-4 mr-1.5" />
                  {isBooking ? "Converting..." : "Mark as Converted"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Outbound Lead Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Outbound Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OutboundLeadLinker
                leadId={lead._id}
                outboundLeadId={lead.outbound_lead_id}
                leadName={leadName}
                onLinked={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["lead", contactId],
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Summary Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.summary ? (
                <SummarySections html={lead.summary} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No summary available
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    A summary will appear here once the lead books a call.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Q&A Section */}
          {lead.questions_and_answers &&
            lead.questions_and_answers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Questions & Answers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lead.questions_and_answers
                      .sort((a, b) => a.position - b.position)
                      .map((qa, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium">{qa.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {qa.answer}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Sales Tracking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Sales Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Score */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Score
                </label>
                <Select
                  value={lead.score != null ? String(lead.score) : "none"}
                  onValueChange={(val) =>
                    patchLead(
                      { score: val === "none" ? null : Number(val) },
                      val === "none"
                        ? "Score cleared"
                        : `Score set to ${val}`
                    )
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Not scored" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not scored</SelectItem>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / 10
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Contract Value */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  Contract Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={contractInput}
                    onChange={(e) => setContractInput(e.target.value)}
                    onFocus={() =>
                      setContractInput(
                        lead.contract_value != null
                          ? String(lead.contract_value)
                          : ""
                      )
                    }
                    onBlur={() => {
                      const num =
                        contractInput === "" ? null : Number(contractInput);
                      if (num !== lead.contract_value) {
                        patchLead(
                          { contract_value: num },
                          num == null
                            ? "Contract value cleared"
                            : `Contract value set to $${num}`
                        );
                      }
                      setContractInput("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                    }}
                    disabled={isSaving}
                    className="pl-7"
                  />
                </div>
                {lead.contract_value != null && !contractInput && (
                  <p className="text-sm font-medium text-green-600">
                    ${lead.contract_value.toLocaleString()}
                  </p>
                )}
              </div>

              <Separator />

              {/* Closed */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Closed
                </label>
                {lead.closed_at ? (
                  <div className="space-y-2">
                    <Badge
                      variant="default"
                      className="bg-emerald-500 text-white hover:bg-emerald-500"
                    >
                      Closed {formatShortDate(lead.closed_at)}
                    </Badge>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() =>
                          patchLead(
                            { closed_at: null },
                            "Closed date cleared"
                          )
                        }
                        disabled={isSaving}
                      >
                        Clear date
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      patchLead(
                        { closed_at: new Date().toISOString() },
                        "Lead marked as closed"
                      )
                    }
                    disabled={isSaving}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Mark as Closed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline / Key Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "Created",
                    date: lead.date_created,
                    color: "bg-slate-400",
                  },
                  {
                    label: "Link Sent",
                    date: lead.link_sent_at,
                    color: "bg-blue-500",
                  },
                  {
                    label: "Follow Up",
                    date: lead.follow_up_at,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Booked",
                    date: lead.booked_at,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Ghosted",
                    date: lead.ghosted_at,
                    color: "bg-red-500",
                  },
                  {
                    label: "Closed",
                    date: lead.closed_at,
                    color: "bg-emerald-600",
                  },
                ]
                  .filter((item) => item.date)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          item.color
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatShortDate(item.date)}
                      </p>
                    </div>
                  ))}
                {![
                  lead.date_created,
                  lead.link_sent_at,
                  lead.follow_up_at,
                  lead.booked_at,
                  lead.ghosted_at,
                  lead.closed_at,
                ].some(Boolean) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
