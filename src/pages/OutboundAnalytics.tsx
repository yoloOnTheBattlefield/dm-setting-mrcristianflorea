import { useMemo, useState } from "react";
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
  OutboundFunnelData,
} from "@/hooks/useOutboundAnalytics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangeFilter } from "@/lib/types";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// New components
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

// ─── Benchmarks ───
const BENCHMARK_REPLY_RATE = 8; // Industry avg for B2B cold outreach
const BENCHMARK_CONVERSION_RATE = 5; // Replied → Converted avg
const BENCHMARK_OVERALL_RATE = 1; // Messaged → Converted avg
const EST_DEAL_VALUE = 500; // Default estimated deal value for pipeline calc

function rateColor(rate: number | undefined | null) {
  if (rate == null) return "text-muted-foreground";
  if (rate >= 10) return "text-green-400";
  if (rate >= 5) return "text-yellow-400";
  return "text-red-400";
}

function fmtRate(v: number | undefined | null) {
  return v != null ? `${v.toFixed(1)}%` : "-";
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

// ─── Computed Insight Logic ───
function computeInsight(funnel: OutboundFunnelData): { text: string; type: "info" | "warning" | "success" } | null {
  if (funnel.messaged === 0) return null;

  const replyRate = pct(funnel.replied, funnel.messaged);
  const convRate = pct(funnel.booked, funnel.replied);
  const overallRate = pct(funnel.booked, funnel.messaged);

  // Find biggest bottleneck
  const messagedToReplied = pct(funnel.messaged - funnel.replied, funnel.messaged);
  const repliedToConverted = funnel.replied > 0 ? pct(funnel.replied - funnel.booked, funnel.replied) : 0;

  // Great performance
  if (replyRate >= 15 && convRate >= 10) {
    return {
      text: `Strong performance — ${replyRate.toFixed(1)}% reply rate and ${convRate.toFixed(1)}% conversion rate are both well above industry average.`,
      type: "success",
    };
  }

  // Good reply rate but no conversions
  if (replyRate >= BENCHMARK_REPLY_RATE && funnel.booked === 0 && funnel.replied > 0) {
    return {
      text: `Your reply rate is ${replyRate.toFixed(1)}% (above ${BENCHMARK_REPLY_RATE}% avg), but ${funnel.replied} replies haven't converted yet — focus on follow-up messaging and offer positioning.`,
      type: "warning",
    };
  }

  // Good reply rate, low conversion
  if (replyRate >= BENCHMARK_REPLY_RATE && convRate < BENCHMARK_CONVERSION_RATE && funnel.replied > 0) {
    return {
      text: `Healthy ${replyRate.toFixed(1)}% reply rate, but only ${convRate.toFixed(1)}% convert — your biggest opportunity is improving follow-up conversations.`,
      type: "warning",
    };
  }

  // Low reply rate is the bottleneck
  if (replyRate < BENCHMARK_REPLY_RATE && messagedToReplied > repliedToConverted) {
    return {
      text: `Reply rate is ${replyRate.toFixed(1)}% (below ${BENCHMARK_REPLY_RATE}% avg) — try A/B testing your opening messages or adjusting targeting.`,
      type: "warning",
    };
  }

  // General insight
  if (overallRate > 0) {
    return {
      text: `${funnel.messaged.toLocaleString()} messaged with ${overallRate.toFixed(1)}% overall conversion. ${replyRate >= BENCHMARK_REPLY_RATE ? "Reply rate is healthy" : "Reply rate needs attention"}.`,
      type: replyRate >= BENCHMARK_REPLY_RATE ? "info" : "warning",
    };
  }

  return {
    text: `${funnel.messaged.toLocaleString()} messages sent, ${funnel.replied.toLocaleString()} replies received. Keep going — early campaigns need volume to see patterns.`,
    type: "info",
  };
}

export default function OutboundAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = usePersistedState<DateRangeFilter>("ob-analytics-dateRange", "all");
  const [campaignId, setCampaignId] = usePersistedState<string>("ob-analytics-campaign", "all");
  const [senderFilter, setSenderFilter] = usePersistedState<string>("ob-analytics-sender", "all");

  // Collapsible sections
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDailyChart, setShowDailyChart] = useState(true);
  const [showResponseSpeed, setShowResponseSpeed] = useState(true);
  const [showConversationDepth, setShowConversationDepth] = useState(true);
  const [showEffort, setShowEffort] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  // Message tab sorting
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

  // Campaigns for filter dropdown
  const { data: campaignsData } = useCampaigns({ limit: 100 });
  const campaigns = campaignsData?.campaigns || [];

  // Core analytics queries
  const { data: funnel, isLoading: funnelLoading } = useOutboundFunnel(filterParams);
  const { data: messagesData, isLoading: messagesLoading } = useMessageAnalytics(filterParams);
  const { data: sendersData, isLoading: sendersLoading } = useSenderAnalytics(filterParams);
  const { data: campaignsAnalytics, isLoading: campaignsAnalyticsLoading } = useCampaignAnalytics(filterParams);

  // New analytics queries
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

  const messages = messagesData?.messages || [];
  const senders = sendersData?.senders || [];
  const campaignPerf = campaignsAnalytics?.campaigns || [];
  const dailyDays = dailyData?.days || [];
  const aiModels = aiModelsData?.models || [];
  const todHours = todData?.hours || [];
  const trends = trendData?.trends || [];

  // Computed insight
  const insight = useMemo(() => {
    if (!funnel) return null;
    return computeInsight(funnel);
  }, [funnel]);

  // Sorted messages for template performance
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

  return (
    <div className="flex flex-1 flex-col">
      {/* Header — unified filter toolbar */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between gap-4">
          <div className="shrink-0">
            <h2 className="text-2xl font-bold tracking-tight">Outbound Analytics</h2>
            <p className="text-muted-foreground text-sm">Performance metrics across your outbound pipeline</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col gap-1 w-52">
              <Label className="text-[10px] text-muted-foreground">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-muted-foreground">Date Range</Label>
              <DateFilter value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="funnel" className="space-y-6">
          {/* Tab icons + tooltip descriptions (#13) */}
          <TabsList>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="funnel" className="gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    Funnel
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Pipeline stages and conversion flow</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="messages" className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messages
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Compare performance by message template</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="senders" className="gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Senders
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Compare performance by team member</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="campaigns" className="gap-1.5">
                    <Megaphone className="h-3.5 w-3.5" />
                    Campaigns
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Campaign-level metrics and revenue</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="ai-models" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Models
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Compare AI model performance</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          {/* ─── Tab 1: Funnel ─── */}
          <TabsContent value="funnel">
            {funnelLoading ? (
              <DashboardSkeleton />
            ) : funnel ? (
              <div className="space-y-6">
                {/* Insight Banner (#9) */}
                {insight && <InsightBanner text={insight.text} type={insight.type} />}

                {/* Funnel cards with Revenue highlight (#1, #14) */}
                <div className="flex items-center gap-2">
                  <FunnelCard
                    label="Messaged"
                    value={funnel.messaged}
                    icon={<Send className="h-4 w-4 text-violet-400" />}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Replied"
                    value={funnel.replied}
                    sub={fmtPct(funnel.replied, funnel.messaged)}
                    icon={<MessageCircle className="h-4 w-4 text-yellow-400" />}
                    benchmark={
                      funnel.messaged > 0
                        ? { value: pct(funnel.replied, funnel.messaged), avg: BENCHMARK_REPLY_RATE }
                        : undefined
                    }
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Converted"
                    value={funnel.booked}
                    sub={funnel.replied > 0 ? fmtPct(funnel.booked, funnel.replied) : undefined}
                    icon={<CalendarCheck className="h-4 w-4 text-green-400" />}
                    zeroPrompt={funnel.booked === 0 && funnel.replied > 0 ? "Focus on follow-up" : undefined}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Revenue"
                    value={
                      (funnel.contract_value ?? 0) > 0
                        ? `$${(funnel.contract_value ?? 0).toLocaleString()}`
                        : "$0"
                    }
                    sub={
                      (funnel.contract_value ?? 0) > 0
                        ? `${funnel.contracts ?? 0} deal${(funnel.contracts ?? 0) !== 1 ? "s" : ""}`
                        : funnel.replied > 0
                        ? `Est. pipeline: $${(funnel.replied * EST_DEAL_VALUE).toLocaleString()}`
                        : `${funnel.contracts ?? 0} deals`
                    }
                    icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
                    highlight
                  />
                </div>

                {/* Stage Conversion Rates (#4) with colors, progress arcs, benchmarks */}
                <Card>
                  <CardContent className="py-4 px-6">
                    <h3 className="text-sm font-medium mb-4">Stage Conversion Rates</h3>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <ConversionRateCard
                        label="Messaged → Replied"
                        rate={pct(funnel.replied, funnel.messaged)}
                        benchmark={BENCHMARK_REPLY_RATE}
                        benchmarkLabel="Industry avg: ~8%"
                      />
                      <ConversionRateCard
                        label="Replied → Converted"
                        rate={pct(funnel.booked, funnel.replied)}
                        benchmark={BENCHMARK_CONVERSION_RATE}
                        benchmarkLabel="Industry avg: ~5%"
                      />
                      <ConversionRateCard
                        label="Overall (Messaged → Converted)"
                        rate={pct(funnel.booked, funnel.messaged)}
                        benchmark={BENCHMARK_OVERALL_RATE}
                        benchmarkLabel="Industry avg: ~1%"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Funnel Drop-Off */}
                <FunnelDropoff data={funnel} />

                {/* Contextual CTA after drop-off (#11) */}
                <FunnelCTA funnel={funnel} />

                {/* Activity Heatmap - Collapsible */}
                <CollapsibleSection
                  title="Activity Heatmap"
                  open={showHeatmap}
                  onToggle={() => setShowHeatmap(!showHeatmap)}
                >
                  <ActivityHeatmap data={dailyDays} />
                </CollapsibleSection>

                {/* Daily Performance Chart - Collapsible */}
                <CollapsibleSection
                  title="Daily Performance"
                  open={showDailyChart}
                  onToggle={() => setShowDailyChart(!showDailyChart)}
                >
                  <DailyPerformanceChart data={dailyDays} />
                </CollapsibleSection>

                {/* Trend Over Time */}
                <CollapsibleSection
                  title="Rolling Performance Trends"
                  open={showTrend}
                  onToggle={() => setShowTrend(!showTrend)}
                >
                  <TrendOverTime data={trends} />
                </CollapsibleSection>

                {/* Response Speed + Conversation Depth - side by side */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <CollapsibleSection
                    title="Response Speed"
                    open={showResponseSpeed}
                    onToggle={() => setShowResponseSpeed(!showResponseSpeed)}
                  >
                    {responseSpeedData && <ResponseSpeedPanel data={responseSpeedData} />}
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Conversation Depth"
                    open={showConversationDepth}
                    onToggle={() => setShowConversationDepth(!showConversationDepth)}
                  >
                    {conversationDepthData && <ConversationDepthMetrics data={conversationDepthData} />}
                  </CollapsibleSection>
                </div>

                {/* Effort vs Outcome + Edited Comparison + Time of Day */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <CollapsibleSection
                    title="Effort vs Outcome"
                    open={showEffort}
                    onToggle={() => setShowEffort(!showEffort)}
                  >
                    {effortData && <EffortOutcomePanel data={effortData} />}
                  </CollapsibleSection>

                  {editedData && <EditedComparison data={editedData} />}

                  {todHours.length > 0 && <TimeOfDayHeatmap data={todHours} />}
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* ─── Tab 2: Messages (with Template Performance) ─── */}
          <TabsContent value="messages">
            {messagesLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="w-[30%]">Template</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Replied</TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none hover:text-foreground"
                        onClick={() => handleMsgSort("reply_rate")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Reply Rate
                          <SortIndicator field="reply_rate" current={msgSortField} dir={msgSortDir} />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Converted</TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none hover:text-foreground"
                        onClick={() => handleMsgSort("book_rate")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Conv. Rate
                          <SortIndicator field="book_rate" current={msgSortField} dir={msgSortDir} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMessages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No message data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedMessages.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{m.campaign_name}</span>
                              {m.template_index != null && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  #{m.template_index + 1}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[400px] truncate">
                            {m.template}
                          </TableCell>
                          <TableCell className="text-right">{m.sent}</TableCell>
                          <TableCell className="text-right">{m.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(m.reply_rate)}`}>
                            {fmtRate(m.reply_rate)}
                          </TableCell>
                          <TableCell className="text-right">{m.booked ?? 0}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(m.book_rate)}`}>
                            {fmtRate(m.book_rate)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab 3: Senders ─── */}
          <TabsContent value="senders">
            {sendersLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card">
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
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No sender data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      senders.map((s) => (
                        <TableRow key={s.sender_id}>
                          <TableCell className="font-medium">@{s.ig_username}</TableCell>
                          <TableCell>{s.display_name || "-"}</TableCell>
                          <TableCell className="text-right">{s.sent}</TableCell>
                          <TableCell className="text-right">{s.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(s.reply_rate)}`}>
                            {fmtRate(s.reply_rate)}
                          </TableCell>
                          <TableCell className="text-right">{s.booked ?? 0}</TableCell>
                          <TableCell className="text-right">
                            {fmtRate(s.book_rate)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab 4: Campaigns ─── */}
          <TabsContent value="campaigns">
            {campaignsAnalyticsLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card">
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
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No campaign data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaignPerf.map((c) => (
                        <TableRow key={c.campaign_id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={c.status === "active" ? "default" : "outline"}
                              className={
                                c.status === "active"
                                  ? "bg-green-600/20 text-green-400 border-green-600/30"
                                  : c.status === "paused"
                                  ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                                  : c.status === "completed"
                                  ? "bg-blue-600/20 text-blue-400 border-blue-600/30"
                                  : ""
                              }
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{c.total_leads}</TableCell>
                          <TableCell className="text-right">{c.sent}</TableCell>
                          <TableCell className="text-right">{c.replied}</TableCell>
                          <TableCell className={`text-right font-medium ${rateColor(c.reply_rate)}`}>
                            {fmtRate(c.reply_rate)}
                          </TableCell>
                          <TableCell className="text-right">{c.booked ?? 0}</TableCell>
                          <TableCell className="text-right">
                            {fmtRate(c.book_rate)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(c.contract_value ?? 0) > 0 ? `$${c.contract_value.toLocaleString()}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab 5: AI Models ─── */}
          <TabsContent value="ai-models">
            <div className="space-y-4">
              {/* Sender filter for AI Models tab */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1.5 w-52">
                  <Label className="text-xs">Sender</Label>
                  <Select value={senderFilter} onValueChange={setSenderFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Senders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Senders</SelectItem>
                      {senders.map((s) => (
                        <SelectItem key={s.sender_id} value={s.sender_id}>
                          @{s.ig_username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AIModelComparison data={aiModels} isLoading={aiModelsLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Helper Components ───

function InsightBanner({ text, type }: { text: string; type: "info" | "warning" | "success" }) {
  const bgClass =
    type === "success"
      ? "bg-green-500/10 border-green-500/20"
      : type === "warning"
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-blue-500/10 border-blue-500/20";

  const iconClass =
    type === "success"
      ? "text-green-400"
      : type === "warning"
      ? "text-amber-400"
      : "text-blue-400";

  return (
    <div className={cn("rounded-lg border px-4 py-3 flex items-start gap-3", bgClass)}>
      <Lightbulb className={cn("h-4 w-4 mt-0.5 shrink-0", iconClass)} />
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function FunnelCard({
  label,
  value,
  sub,
  icon,
  highlight,
  benchmark,
  zeroPrompt,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
  benchmark?: { value: number; avg: number };
  zeroPrompt?: string;
}) {
  return (
    <Card
      className={cn(
        "flex-1 min-w-0 transition-colors",
        highlight && "bg-emerald-500/10 border-emerald-500/20"
      )}
    >
      <CardContent className="py-3 px-4 flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("font-bold leading-tight", highlight ? "text-2xl" : "text-lg")}>
            {value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          {zeroPrompt && (
            <p className="text-[10px] text-amber-400 mt-0.5">{zeroPrompt}</p>
          )}
          {benchmark && (
            <BenchmarkChip value={benchmark.value} avg={benchmark.avg} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkChip({ value, avg }: { value: number; avg: number }) {
  if (value === 0) return null;
  const above = value >= avg;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full",
        above
          ? "bg-green-500/15 text-green-400"
          : "bg-red-500/15 text-red-400"
      )}
    >
      {above ? "↑" : "↓"} {above ? "Above" : "Below"} avg ({avg}%)
    </span>
  );
}

function ConversionRateCard({
  label,
  rate,
  benchmark,
  benchmarkLabel,
}: {
  label: string;
  rate: number;
  benchmark: number;
  benchmarkLabel: string;
}) {
  const pctVal = Math.min(rate, 100);
  const colorClass = rateColor(rate);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {/* Mini progress arc */}
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/30"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(pctVal / 100) * 175.9} 175.9`}
            className={cn(
              rate >= 10 ? "text-green-400" : rate >= 5 ? "text-yellow-400" : "text-red-400"
            )}
            stroke="currentColor"
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", colorClass)}>
          {rate === 0 ? "0%" : `${rate.toFixed(1)}%`}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">{benchmarkLabel}</p>
      {rate > 0 && <BenchmarkChip value={rate} avg={benchmark} />}
    </div>
  );
}

function FunnelCTA({ funnel }: { funnel: OutboundFunnelData }) {
  const ctas: { text: string; type: "warning" | "info" }[] = [];

  // Replied → Converted drop
  if (funnel.replied > 0 && funnel.booked === 0) {
    ctas.push({
      text: `${funnel.replied} people replied but none converted yet. Review their conversations to identify what's blocking conversions.`,
      type: "warning",
    });
  } else if (funnel.replied > 0) {
    const convDrop = pct(funnel.replied - funnel.booked, funnel.replied);
    if (convDrop > 80) {
      ctas.push({
        text: `${funnel.replied - funnel.booked} replies didn't convert (${convDrop.toFixed(0)}% drop). Review follow-up conversations for improvement opportunities.`,
        type: "warning",
      });
    }
  }

  // Messaged → Replied drop
  if (funnel.messaged > 0) {
    const replyRate = pct(funnel.replied, funnel.messaged);
    if (replyRate < BENCHMARK_REPLY_RATE) {
      ctas.push({
        text: `Reply rate is ${replyRate.toFixed(1)}% — try A/B testing your message templates or adjusting your lead targeting.`,
        type: "info",
      });
    }
  }

  if (ctas.length === 0) return null;

  return (
    <div className="space-y-2">
      {ctas.map((cta, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border px-4 py-3 flex items-center gap-3 text-sm",
            cta.type === "warning"
              ? "bg-amber-500/5 border-amber-500/15"
              : "bg-blue-500/5 border-blue-500/15"
          )}
        >
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0",
              cta.type === "warning" ? "text-amber-400" : "text-blue-400"
            )}
          />
          <span className="text-muted-foreground">{cta.text}</span>
        </div>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
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

function SortIndicator({
  field,
  current,
  dir,
}: {
  field: string;
  current: string;
  dir: SortDir;
}) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
  return dir === "desc" ? (
    <ChevronDown className="h-3 w-3" />
  ) : (
    <ChevronUp className="h-3 w-3" />
  );
}
