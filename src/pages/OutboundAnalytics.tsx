import { useState, useMemo } from "react";
import {
  useOutboundFunnel,
  useMessageAnalytics,
  useSenderAnalytics,
  useCampaignAnalytics,
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
  Users,
  Send,
  MessageCircle,
  CalendarCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";

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

export default function OutboundAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [campaignId, setCampaignId] = useState<string>("all");

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

  // Campaigns for filter dropdown
  const { data: campaignsData } = useCampaigns({ limit: 100 });
  const campaigns = campaignsData?.campaigns || [];

  // Analytics queries
  const { data: funnel, isLoading: funnelLoading } = useOutboundFunnel({
    start_date: startDate,
    end_date: endDate,
    campaign_id: cid,
  });
  const { data: messagesData, isLoading: messagesLoading } = useMessageAnalytics({ campaign_id: cid });
  const { data: sendersData, isLoading: sendersLoading } = useSenderAnalytics({ campaign_id: cid });
  const { data: campaignsAnalytics, isLoading: campaignsAnalyticsLoading } = useCampaignAnalytics();

  const messages = messagesData?.messages || [];
  const senders = sendersData?.senders || [];
  const campaignPerf = campaignsAnalytics?.campaigns || [];

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
          </TabsList>

          {/* Tab 1: Funnel */}
          <TabsContent value="funnel">
            {funnelLoading ? (
              <DashboardSkeleton />
            ) : funnel ? (
              <div className="space-y-6">
                {/* Funnel cards */}
                <div className="flex items-center gap-2">
                  <FunnelCard
                    label="Total"
                    value={funnel.total}
                    icon={<Users className="h-4 w-4 text-blue-400" />}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FunnelCard
                    label="Messaged"
                    value={funnel.messaged}
                    sub={pct(funnel.messaged, funnel.total)}
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
                    label="Booked"
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
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total → Messaged</p>
                        <p className="text-lg font-bold">{pct(funnel.messaged, funnel.total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Messaged → Replied</p>
                        <p className="text-lg font-bold">{pct(funnel.replied, funnel.messaged)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Replied → Booked</p>
                        <p className="text-lg font-bold">{pct(funnel.booked, funnel.replied)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Overall (Total → Booked)</p>
                        <p className="text-lg font-bold">{pct(funnel.booked, funnel.total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Tab 2: Messages */}
          <TabsContent value="messages">
            {messagesLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="w-[35%]">Template</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Replied</TableHead>
                      <TableHead className="text-right">Reply Rate</TableHead>
                      <TableHead className="text-right">Booked</TableHead>
                      <TableHead className="text-right">Book Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No message data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((m, i) => (
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
                          <TableCell className="text-right">
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

          {/* Tab 3: Senders */}
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
                      <TableHead className="text-right">Booked</TableHead>
                      <TableHead className="text-right">Book Rate</TableHead>
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

          {/* Tab 4: Campaigns */}
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
                      <TableHead className="text-right">Booked</TableHead>
                      <TableHead className="text-right">Book Rate</TableHead>
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
        </Tabs>
      </div>
    </div>
  );
}

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
