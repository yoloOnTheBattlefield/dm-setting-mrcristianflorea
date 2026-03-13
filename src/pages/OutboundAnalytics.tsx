import { useMemo, useState, useRef, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  useOutboundFunnel,
  useMessageAnalytics,
  useSenderAnalytics,
  useCampaignAnalytics,
  useDailyActivity,
  useResponseSpeed,
  useConversationDepth,
  useAIModelAnalytics,
  useEditedComparison,
  useTimeOfDay,
  useEffortOutcome,
  useTrendOverTime,
  useFollowerTiers,
  usePromptLabels,
  useQuestionTypes,
  OutboundFunnelData,
} from "@/hooks/useOutboundAnalytics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  MessageCircle,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Lightbulb,
  Filter,
  Users,
  Megaphone,
  Sparkles,
  MessageSquare,
  Link2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ActivityHeatmap } from "@/components/outbound-analytics/ActivityHeatmap";
import { DailyPerformanceChart } from "@/components/outbound-analytics/DailyPerformanceChart";
import { FunnelDropoff } from "@/components/outbound-analytics/FunnelDropoff";
import { ResponseSpeedPanel } from "@/components/outbound-analytics/ResponseSpeedPanel";
import { ConversationDepthMetrics } from "@/components/outbound-analytics/ConversationDepthMetrics";
import { AIModelComparison } from "@/components/outbound-analytics/AIModelComparison";
import { EditedComparison } from "@/components/outbound-analytics/EditedComparison";
import { TimeOfDayHeatmap } from "@/components/outbound-analytics/TimeOfDayHeatmap";
import { EffortOutcomePanel } from "@/components/outbound-analytics/EffortOutcomePanel";
import { TrendOverTime } from "@/components/outbound-analytics/TrendOverTime";
import { InsightsTab } from "@/components/outbound-analytics/InsightsTab";
import { AIReportTab } from "@/components/outbound-analytics/AIReportTab";

// ─── Benchmarks & Constants ───
const BENCHMARK_REPLY_RATE = 8;
const BENCHMARK_LINK_SENT_RATE = 30; // % of replies that get a link
const BENCHMARK_LINK_CONVERSION_RATE = 15; // % of link_sent that convert
const BENCHMARK_CONVERSION_RATE = 5;
const BENCHMARK_OVERALL_RATE = 1;
const EST_DEAL_VALUE = 500;

// ─── Semantic color helpers (§11) ───
function rateColor(rate: number | undefined | null) {
  if (rate == null) return "text-[#A0AEC0]"; // gray = no data
  if (rate >= 10) return "text-[#22C55E]";   // green = good
  if (rate >= 5) return "text-[#F59E0B]";    // amber = watch
  return "text-[#EF4444]";                   // red = critical
}

function fmtRate(v: number | undefined | null) {
  return v != null ? `${v.toFixed(1)}%` : "—";
}

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return (a / b) * 100;
}

function fmtPct(a: number, b: number) {
  if (b === 0) return "0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

type MessageSortField = "reply_rate" | "book_rate";
type SortDir = "asc" | "desc";

// ─── Insight Logic (§4) — Link Sent-aware ───
function computeInsight(f: OutboundFunnelData): { text: string; type: "info" | "warning" | "success" } | null {
  const linkSent = f.link_sent ?? 0;

  // All zeros
  if (f.messaged === 0 && f.replied === 0 && linkSent === 0 && f.booked === 0) {
    return { text: "No activity yet in this date range — try expanding to 90 days or launching a new campaign.", type: "info" };
  }

  if (f.messaged === 0) return null;

  const replyRate = pct(f.replied, f.messaged);

  // Link Sent = 0, Replied > 0  →  drop-off before offer
  if (linkSent === 0 && f.replied > 0) {
    return {
      text: `${f.replied} people replied but none received a link — your drop-off is before the offer. Try sending a booking link earlier.`,
      type: "warning",
    };
  }

  // Link Sent > 0, Converted = 0  →  offer not converting
  if (linkSent > 0 && f.booked === 0) {
    return {
      text: `${linkSent} people received your link but none converted — consider A/B testing your offer page or tightening follow-up timing.`,
      type: "warning",
    };
  }

  // Good reply rate, replies not converting
  if (f.replied > 0 && replyRate >= BENCHMARK_REPLY_RATE && f.booked === 0) {
    return {
      text: `Reply rate is ${replyRate.toFixed(1)}% (above ${BENCHMARK_REPLY_RATE}% avg), but ${f.replied} replies haven't converted — focus on follow-up messaging.`,
      type: "warning",
    };
  }

  // Strong performance
  const convRate = pct(f.booked, f.replied);
  if (replyRate >= 15 && convRate >= 10) {
    return {
      text: `Strong performance — ${replyRate.toFixed(1)}% reply rate and ${convRate.toFixed(1)}% conversion are well above average.`,
      type: "success",
    };
  }

  // Low reply rate
  if (replyRate < BENCHMARK_REPLY_RATE) {
    return {
      text: `Reply rate is ${replyRate.toFixed(1)}% (below ${BENCHMARK_REPLY_RATE}% avg) — try A/B testing your opening messages or adjusting targeting.`,
      type: "warning",
    };
  }

  // General
  return {
    text: `${f.messaged.toLocaleString()} messaged, ${f.replied.toLocaleString()} replied, ${linkSent.toLocaleString()} links sent. ${replyRate >= BENCHMARK_REPLY_RATE ? "Reply rate is healthy" : "Reply rate needs attention"}.`,
    type: replyRate >= BENCHMARK_REPLY_RATE ? "info" : "warning",
  };
}

export default function OutboundAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>("ob-analytics-dateRange", "all");
  const [campaignId, setCampaignId] = usePersistedState<string>("ob-analytics-campaign", "all");
  const [senderFilter, setSenderFilter] = usePersistedState<string>("ob-analytics-sender", "all");

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDailyChart, setShowDailyChart] = useState(true);
  const [showResponseSpeed, setShowResponseSpeed] = useState(true);
  const [showConversationDepth, setShowConversationDepth] = useState(true);
  const [showEffort, setShowEffort] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  const [msgSortField, setMsgSortField] = useState<MessageSortField>("reply_rate");
  const [msgSortDir, setMsgSortDir] = useState<SortDir>("desc");

  const endDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    return new Date().toISOString().split("T")[0];
  }, [dateRange]);

  const startDate = useMemo(() => {
    if (dateRange === "all") return undefined;
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().split("T")[0];
  }, [dateRange]);

  const cid = campaignId === "all" ? undefined : campaignId;
  const filterParams = { start_date: startDate, end_date: endDate, campaign_id: cid };

  const { data: campaignsData } = useCampaigns({ limit: 100 });
  const campaigns = campaignsData?.campaigns || [];

  const { data: funnel, isLoading: funnelLoading } = useOutboundFunnel(filterParams);
  const { data: messagesData, isLoading: messagesLoading } = useMessageAnalytics(filterParams);
  const { data: sendersData, isLoading: sendersLoading } = useSenderAnalytics(filterParams);
  const { data: campaignsAnalytics, isLoading: campaignsAnalyticsLoading } = useCampaignAnalytics(filterParams);
  const { data: dailyData } = useDailyActivity(filterParams);
  const { data: responseSpeedData } = useResponseSpeed(filterParams);
  const { data: conversationDepthData } = useConversationDepth(filterParams);
  const { data: aiModelsData, isLoading: aiModelsLoading } = useAIModelAnalytics({
    ...filterParams,
    sender_id: senderFilter === "all" ? undefined : senderFilter,
  });
  const { data: editedData } = useEditedComparison(filterParams);
  const { data: todData } = useTimeOfDay(filterParams);
  const { data: effortData } = useEffortOutcome(filterParams);
  const { data: trendData } = useTrendOverTime(filterParams);
  const { data: followerTiersData, isLoading: tiersLoading } = useFollowerTiers(filterParams);
  const { data: promptLabelsData, isLoading: labelsLoading } = usePromptLabels(filterParams);
  const { data: questionTypesData, isLoading: questionTypesLoading } = useQuestionTypes(filterParams);

  const messages = messagesData?.messages || [];
  const senders = sendersData?.senders || [];
  const campaignPerf = campaignsAnalytics?.campaigns || [];
  const dailyDays = dailyData?.days || [];
  const aiModels = aiModelsData?.models || [];
  const todHours = todData?.hours || [];
  const trends = trendData?.trends || [];
  const followerTiers = followerTiersData?.tiers || [];
  const promptLabels = promptLabelsData?.labels || [];
  const questionTypes = questionTypesData?.types || [];
  const insightsLoading = tiersLoading || labelsLoading || questionTypesLoading;

  const insight = useMemo(() => {
    if (!funnel) return null;
    return computeInsight(funnel);
  }, [funnel]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aVal = a[msgSortField] ?? 0;
      const bVal = b[msgSortField] ?? 0;
      return msgSortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [messages, msgSortField, msgSortDir]);

  function handleMsgSort(field: MessageSortField) {
    if (msgSortField === field) {
      setMsgSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setMsgSortField(field);
      setMsgSortDir("desc");
    }
  }

  // Derived link_sent with fallback to 0 for old API responses
  const linkSent = funnel?.link_sent ?? 0;

  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(0);

  useEffect(() => {
    if (!stickyRef.current) return;
    const ro = new ResizeObserver(() => setStickyH(stickyRef.current?.offsetHeight ?? 0));
    ro.observe(stickyRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <Tabs defaultValue="funnel">
    <div className="flex flex-1 flex-col">
      {/* Header — unified filter toolbar (§10) */}
      <div ref={stickyRef} className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 md:rounded-lg md:border md:border-[#E2E8F0] md:bg-card md:px-3 md:py-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:block" />
            <div className="flex flex-col gap-1 w-full md:w-52">
              <Label className="text-[10px] text-muted-foreground">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-px h-8 bg-border hidden md:block" />
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-muted-foreground">Date Range</Label>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <DateFilter value={dateRange} onChange={setDateRange} />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 pb-2 overflow-x-auto">
          <TabsList>
            <TabsTrigger value="funnel" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />Funnel
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />Messages
            </TabsTrigger>
            <TabsTrigger value="senders" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />Senders
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />Campaigns
            </TabsTrigger>
            <TabsTrigger value="ai-models" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />AI Models
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />Insights
            </TabsTrigger>
            <TabsTrigger value="ai-report" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />AI Report
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 space-y-6" style={{ paddingTop: stickyH }}>

          {/* ─── Funnel Tab ─── */}
          <TabsContent value="funnel">
            {funnelLoading ? (
              <DashboardSkeleton />
            ) : funnel ? (
              <div className="space-y-6">
                {/* AI Insight Banner (§4) */}
                {insight && <InsightBanner text={insight.text} type={insight.type} />}

                {/* 5 KPI Cards: Messaged → Replied → Link Sent → Converted → Revenue (§1) */}
                <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                  <FunnelCard
                    label="Messaged"
                    value={funnel.messaged}
                    icon={<Send className="h-4 w-4" style={{ color: "#4F6EF7" }} />}
                    zeroMuted={funnel.messaged === 0}
                  />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:block" />
                  <FunnelCard
                    label="Replied"
                    value={funnel.replied}
                    sub={fmtPct(funnel.replied, funnel.messaged)}
                    icon={<MessageCircle className="h-4 w-4" style={{ color: "#7B68EE" }} />}
                    benchmark={funnel.messaged > 0 ? { value: pct(funnel.replied, funnel.messaged), avg: BENCHMARK_REPLY_RATE } : undefined}
                    zeroMuted={funnel.replied === 0}
                  />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:block" />
                  <FunnelCard
                    label="Link Sent"
                    value={linkSent}
                    sub={funnel.replied > 0 ? `${pct(linkSent, funnel.replied).toFixed(1)}% of replies` : undefined}
                    icon={<Link2 className="h-4 w-4" style={{ color: "#F5A623" }} />}
                    benchmark={funnel.replied > 0 ? { value: pct(linkSent, funnel.replied), avg: BENCHMARK_LINK_SENT_RATE } : undefined}
                    zeroPrompt={linkSent === 0 && funnel.replied > 0 ? "No links sent yet" : undefined}
                    zeroMuted={linkSent === 0}
                  />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:block" />
                  <FunnelCard
                    label="Converted"
                    value={funnel.booked}
                    sub={linkSent > 0 ? fmtPct(funnel.booked, linkSent) : funnel.replied > 0 ? fmtPct(funnel.booked, funnel.replied) : undefined}
                    icon={<CalendarCheck className="h-4 w-4" style={{ color: "#22C55E" }} />}
                    zeroPrompt={funnel.booked === 0 && funnel.replied > 0 ? "Focus on follow-up" : undefined}
                    zeroMuted={funnel.booked === 0}
                  />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:block" />
                  <FunnelCard
                    label="Revenue"
                    value={(funnel.contract_value ?? 0) > 0 ? `$${(funnel.contract_value ?? 0).toLocaleString()}` : "$0"}
                    sub={
                      (funnel.contract_value ?? 0) > 0
                        ? `${funnel.contracts ?? 0} deal${(funnel.contracts ?? 0) !== 1 ? "s" : ""}`
                        : funnel.replied > 0
                        ? `Est. pipeline: $${(funnel.replied * EST_DEAL_VALUE).toLocaleString()}`
                        : `${funnel.contracts ?? 0} deals`
                    }
                    icon={<DollarSign className="h-5 w-5" style={{ color: "#22C55E" }} />}
                    highlight
                    zeroMuted={(funnel.contract_value ?? 0) === 0}
                    subGreen={(funnel.contract_value ?? 0) === 0 && funnel.replied > 0}
                  />
                </div>

                {/* Stage Conversion Rates — 4 metrics (§3) */}
                <Card>
                  <CardContent className="py-4 px-6">
                    <h3 className="text-sm font-medium mb-4">Stage Conversion Rates</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <ConversionRateCard
                        label="Messaged → Replied"
                        rate={pct(funnel.replied, funnel.messaged)}
                        benchmark={BENCHMARK_REPLY_RATE}
                        benchmarkLabel="Industry avg: ~8%"
                      />
                      <ConversionRateCard
                        label="Replied → Link Sent"
                        rate={pct(linkSent, funnel.replied)}
                        benchmark={BENCHMARK_LINK_SENT_RATE}
                        benchmarkLabel="Industry avg: ~30%"
                      />
                      <ConversionRateCard
                        label="Link Sent → Converted"
                        rate={pct(funnel.booked, linkSent)}
                        benchmark={BENCHMARK_LINK_CONVERSION_RATE}
                        benchmarkLabel="Industry avg: ~15%"
                      />
                      <ConversionRateCard
                        label="Overall"
                        rate={pct(funnel.booked, funnel.messaged)}
                        benchmark={BENCHMARK_OVERALL_RATE}
                        benchmarkLabel="Industry avg: ~1%"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Funnel Drop-Off — 5 stages */}
                <FunnelDropoff data={funnel} />

                {/* Contextual CTA Banner (§5) */}
                <FunnelCTA funnel={funnel} linkSent={linkSent} />

                <CollapsibleSection title="Activity Heatmap" open={showHeatmap} onToggle={() => setShowHeatmap(!showHeatmap)}>
                  <ActivityHeatmap data={dailyDays} />
                </CollapsibleSection>

                <CollapsibleSection title="Daily Performance" open={showDailyChart} onToggle={() => setShowDailyChart(!showDailyChart)}>
                  <DailyPerformanceChart data={dailyDays} />
                </CollapsibleSection>

                <CollapsibleSection title="Rolling Performance Trends" open={showTrend} onToggle={() => setShowTrend(!showTrend)}>
                  <TrendOverTime data={trends} />
                </CollapsibleSection>

                <div className="grid gap-6 lg:grid-cols-2">
                  <CollapsibleSection title="Response Speed" open={showResponseSpeed} onToggle={() => setShowResponseSpeed(!showResponseSpeed)}>
                    {responseSpeedData && <ResponseSpeedPanel data={responseSpeedData} />}
                  </CollapsibleSection>
                  <CollapsibleSection title="Conversation Depth" open={showConversationDepth} onToggle={() => setShowConversationDepth(!showConversationDepth)}>
                    {conversationDepthData && <ConversationDepthMetrics data={conversationDepthData} />}
                  </CollapsibleSection>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <CollapsibleSection title="Effort vs Outcome" open={showEffort} onToggle={() => setShowEffort(!showEffort)}>
                    {effortData && <EffortOutcomePanel data={effortData} />}
                  </CollapsibleSection>
                  {editedData && <EditedComparison data={editedData} />}
                  {todHours.length > 0 && <TimeOfDayHeatmap data={todHours} />}
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* ─── Messages Tab ─── */}
          <TabsContent value="messages">
            {messagesLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Message</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Replied</TableHead>
                      <TableHead className="text-right cursor-pointer select-none hover:text-foreground" onClick={() => handleMsgSort("reply_rate")}>
                        <div className="flex items-center justify-end gap-1">
                          Reply Rate
                          <SortIndicator field="reply_rate" current={msgSortField} dir={msgSortDir} />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Converted</TableHead>
                      <TableHead className="text-right cursor-pointer select-none hover:text-foreground" onClick={() => handleMsgSort("book_rate")}>
                        <div className="flex items-center justify-end gap-1">
                          Conv. Rate
                          <SortIndicator field="book_rate" current={msgSortField} dir={msgSortDir} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMessages.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No message data available.</TableCell></TableRow>
                    ) : (
                      sortedMessages.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs max-w-[500px]">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block truncate">{m.message}</span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[600px] whitespace-pre-wrap text-xs">
                                  {m.message}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">{m.sent}</TableCell>
                          <TableCell className="text-right">{m.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(m.reply_rate)}`}>{fmtRate(m.reply_rate)}</TableCell>
                          <TableCell className={cn("text-right", (m.booked ?? 0) === 0 && "text-[#A0AEC0]")}>{m.booked ?? 0}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(m.book_rate)}`}>{fmtRate(m.book_rate)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── Senders Tab ─── */}
          <TabsContent value="senders">
            {sendersLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IG Username</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Replied</TableHead>
                      <TableHead className="text-right">Reply Rate</TableHead>
                      <TableHead className="text-right">Converted</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {senders.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center">No sender data available.</TableCell></TableRow>
                    ) : (
                      senders.map((s) => (
                        <TableRow key={s.sender_id}>
                          <TableCell className="font-medium">@{s.ig_username}</TableCell>
                          <TableCell>{s.display_name || "—"}</TableCell>
                          <TableCell className="text-right">{s.sent}</TableCell>
                          <TableCell className="text-right">{s.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(s.reply_rate)}`}>{fmtRate(s.reply_rate)}</TableCell>
                          <TableCell className={cn("text-right", (s.booked ?? 0) === 0 && "text-[#A0AEC0]")}>{s.booked ?? 0}</TableCell>
                          <TableCell className="text-right">{fmtRate(s.book_rate)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── Campaigns Tab ─── */}
          <TabsContent value="campaigns">
            {campaignsAnalyticsLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Leads</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Replied</TableHead>
                      <TableHead className="text-right">Reply Rate</TableHead>
                      <TableHead className="text-right">Converted</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignPerf.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="h-24 text-center">No campaign data available.</TableCell></TableRow>
                    ) : (
                      campaignPerf.map((c) => (
                        <TableRow key={c.campaign_id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={c.status === "active" ? "default" : "outline"}
                              className={
                                c.status === "active" ? "bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30"
                                : c.status === "paused" ? "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30"
                                : c.status === "completed" ? "bg-[#4F6EF7]/20 text-[#4F6EF7] border-[#4F6EF7]/30"
                                : ""
                              }
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{c.total_leads}</TableCell>
                          <TableCell className="text-right">{c.sent}</TableCell>
                          <TableCell className="text-right">{c.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(c.reply_rate)}`}>{fmtRate(c.reply_rate)}</TableCell>
                          <TableCell className={cn("text-right", (c.booked ?? 0) === 0 && "text-[#A0AEC0]")}>{c.booked ?? 0}</TableCell>
                          <TableCell className="text-right">{fmtRate(c.book_rate)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(c.contract_value ?? 0) > 0 ? `$${c.contract_value.toLocaleString()}` : <span className="text-[#A0AEC0]">—</span>}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── AI Models Tab ─── */}
          <TabsContent value="ai-models">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1.5 w-full md:w-52">
                  <Label className="text-xs">Sender</Label>
                  <Select value={senderFilter} onValueChange={setSenderFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Senders" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Senders</SelectItem>
                      {senders.map((s) => (
                        <SelectItem key={s.sender_id} value={s.sender_id}>@{s.ig_username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AIModelComparison data={aiModels} isLoading={aiModelsLoading} />
            </div>
          </TabsContent>

          {/* ─── Insights Tab ─── */}
          <TabsContent value="insights">
            <InsightsTab
              tiers={followerTiers}
              labels={promptLabels}
              questionTypes={questionTypes}
              isLoading={insightsLoading}
            />
          </TabsContent>

          {/* ─── AI Report Tab ─── */}
          <TabsContent value="ai-report">
            <AIReportTab filterParams={filterParams} />
          </TabsContent>
      </div>
    </div>
    </Tabs>
  );
}

// ─── Helper Components ───

function InsightBanner({ text, type }: { text: string; type: "info" | "warning" | "success" }) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-4 px-4 py-3 flex items-start gap-3",
        type === "success" ? "bg-[#F0FDF4] border-l-[#22C55E]"
          : type === "warning" ? "bg-[#FFF8EE] border-l-[#F59E0B]"
          : "bg-[#EFF6FF] border-l-[#4F6EF7]"
      )}
    >
      <Lightbulb className={cn(
        "h-4 w-4 mt-0.5 shrink-0",
        type === "success" ? "text-[#22C55E]" : type === "warning" ? "text-[#F59E0B]" : "text-[#4F6EF7]"
      )} />
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function FunnelCard({
  label, value, sub, icon, highlight, benchmark, zeroPrompt, zeroMuted, subGreen,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
  benchmark?: { value: number; avg: number };
  zeroPrompt?: string;
  zeroMuted?: boolean;
  subGreen?: boolean;
}) {
  const isZeroNum = typeof value === "number" && value === 0;
  const isZeroStr = typeof value === "string" && value === "$0";
  const showMuted = zeroMuted && (isZeroNum || isZeroStr);

  return (
    <Card className={cn(
      "flex-1 min-w-0 transition-colors",
      highlight && "bg-[#F0FDF4] border-[#22C55E]/20"
    )}>
      <CardContent className="py-2.5 px-3 flex items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
          <p className={cn(
            "font-bold leading-tight",
            highlight ? "text-xl" : "text-lg",
            showMuted && "text-[#A0AEC0]"
          )}>
            {value}
          </p>
          {sub && <p className={cn("text-[10px] leading-tight", subGreen ? "text-[#22C55E]" : "text-muted-foreground")}>{sub}</p>}
          {zeroPrompt && <p className="text-[10px] text-[#F59E0B] mt-0.5">{zeroPrompt}</p>}
          {benchmark && <BenchmarkChip value={benchmark.value} avg={benchmark.avg} />}
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkChip({ value, avg }: { value: number; avg: number }) {
  if (value === 0) return null;
  const above = value >= avg;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[9px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full",
      above ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-[#FEF2F2] text-[#EF4444]"
    )}>
      {above ? "↑" : "↓"} {above ? "Above" : "Below"} avg ({avg}%)
    </span>
  );
}

function ConversionRateCard({ label, rate, benchmark, benchmarkLabel }: {
  label: string; rate: number; benchmark: number; benchmarkLabel: string;
}) {
  const pctVal = Math.min(rate, 100);
  const arcColor = rate === 0 ? "#EF4444" : rate >= benchmark ? "#22C55E" : "#EF4444";
  const noData = rate === 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      <div className="relative w-[60px] h-[60px]">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle cx="32" cy="32" r="28" fill="none" stroke="#A0AEC0" strokeWidth="4" strokeOpacity="0.15" />
          {noData ? (
            /* Red dot indicator for 0% (§12) */
            <circle cx="32" cy="4" r="3" fill="#EF4444" />
          ) : (
            <circle
              cx="32" cy="32" r="28" fill="none"
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(pctVal / 100) * 175.9} 175.9`}
              stroke={arcColor}
            />
          )}
        </svg>
        <span className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-bold",
          noData ? "text-[#A0AEC0]" : rate >= benchmark ? "text-[#22C55E]" : "text-[#EF4444]"
        )}>
          {rate === 0 ? "0%" : `${rate.toFixed(1)}%`}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">{benchmarkLabel}</p>
      {rate > 0 && <BenchmarkChip value={rate} avg={benchmark} />}
    </div>
  );
}

function FunnelCTA({ funnel, linkSent }: { funnel: OutboundFunnelData; linkSent: number }) {
  let text = "";
  let ctaLabel = "";

  // Priority: link_sent = 0 + replied > 0
  if (linkSent === 0 && funnel.replied > 0) {
    text = `None of your ${funnel.replied} replies got a link. Add a booking link to your follow-up sequence.`;
    ctaLabel = "Edit Follow-up Sequence";
  }
  // link_sent > 0 but converted = 0
  else if (linkSent > 0 && funnel.booked === 0) {
    text = `${linkSent} people got your link but didn't convert. Review those conversations.`;
    ctaLabel = "View Conversations";
  }
  // replied > 0 but converted = 0 (fallback)
  else if (funnel.replied > 0 && funnel.booked === 0) {
    text = `${funnel.replied} people replied but none converted yet. Review their conversations to identify what's blocking conversions.`;
    ctaLabel = "View Conversations";
  }

  if (!text) return null;

  return (
    <div className="rounded-lg border border-[#F59E0B]/20 bg-[#FFF3E0] px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <ArrowRight className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <span className="text-sm text-foreground">{text}</span>
      </div>
      <Button variant="outline" size="sm" className="border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/10 shrink-0 text-xs w-full md:w-auto">
        {ctaLabel}
      </Button>
    </div>
  );
}

function CollapsibleSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 text-sm font-medium transition-colors mb-3",
          "rounded-lg px-3 py-2.5 bg-muted/40 hover:bg-muted/60",
          "text-muted-foreground hover:text-foreground"
        )}
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {title}
      </button>
      {open && children}
    </div>
  );
}

function SortIndicator({ field, current, dir }: { field: string; current: string; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
  return dir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;
}
