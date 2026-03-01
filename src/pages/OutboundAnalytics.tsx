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
} from "lucide-react";

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
  if (b === 0) return "0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

type MessageSortField = "reply_rate" | "book_rate";
type SortDir = "asc" | "desc";

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
      {/* Header */}
      <div className="sticky top-16 z-50 bg-background border-b border-border">
        <div className="px-6 py-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Outbound Analytics</h2>
            <p className="text-muted-foreground">Performance metrics across your outbound pipeline</p>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2 w-56">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
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
            <div className="flex flex-col gap-2">
              <Label>Date Range</Label>
              <DateFilter value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="senders">Senders</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="ai-models">AI Models</TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Funnel ─── */}
          <TabsContent value="funnel">
            {funnelLoading ? (
              <DashboardSkeleton />
            ) : funnel ? (
              <div className="space-y-6">
                {/* Funnel cards */}
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
                    sub={pct(funnel.replied, funnel.messaged)}
                    icon={<MessageCircle className="h-4 w-4 text-yellow-400" />}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Converted"
                    value={funnel.booked}
                    sub={pct(funnel.booked, funnel.replied)}
                    icon={<CalendarCheck className="h-4 w-4 text-green-400" />}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Revenue"
                    value={`$${(funnel.contract_value ?? 0).toLocaleString()}`}
                    sub={`${funnel.contracts ?? 0} deal${(funnel.contracts ?? 0) !== 1 ? "s" : ""}`}
                    icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
                  />
                </div>

                {/* Conversion summary */}
                <Card>
                  <CardContent className="py-4 px-6">
                    <h3 className="text-sm font-medium mb-3">Stage Conversion Rates</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Messaged → Replied</p>
                        <p className="text-lg font-bold">{pct(funnel.replied, funnel.messaged)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Replied → Converted</p>
                        <p className="text-lg font-bold">{pct(funnel.booked, funnel.replied)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Overall (Messaged → Converted)</p>
                        <p className="text-lg font-bold">{pct(funnel.booked, funnel.messaged)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Funnel Drop-Off */}
                <FunnelDropoff data={funnel} />

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

function FunnelCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
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
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
