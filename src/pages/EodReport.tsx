import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Send,
  MessageCircle,
  CalendarCheck,
  UserCheck,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
  Trophy,
} from "lucide-react";
import {
  useTodayReport,
  useTeamReports,
  useSubmitReport,
  type ChecklistItem,
  type EodReport as EodReportType,
} from "@/hooks/useEodReports";
import { useAuth } from "@/contexts/AuthContext";

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, label: "Rough day", color: "text-red-500 hover:text-red-400" },
  { value: 2, icon: Frown, label: "Below average", color: "text-orange-500 hover:text-orange-400" },
  { value: 3, icon: Meh, label: "Average", color: "text-amber-500 hover:text-amber-400" },
  { value: 4, icon: Smile, label: "Good day", color: "text-emerald-500 hover:text-emerald-400" },
  { value: 5, icon: Trophy, label: "Great day!", color: "text-green-500 hover:text-green-400" },
];

const STAT_CARDS = [
  { key: "dms_sent" as const, label: "DMs Sent", icon: Send, color: "text-blue-500" },
  { key: "replies_received" as const, label: "Replies", icon: MessageCircle, color: "text-emerald-500" },
  { key: "bookings_made" as const, label: "Bookings", icon: CalendarCheck, color: "text-purple-500" },
  { key: "follow_ups_completed" as const, label: "Follow-Ups Closed", icon: UserCheck, color: "text-amber-500" },
];

export default function EodReport() {
  const { user } = useAuth();
  const { data: report, isLoading } = useTodayReport();
  const { data: teamReports } = useTeamReports();
  const submitMutation = useSubmitReport();

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const initialized = useRef(false);

  // Initialize local state from fetched report
  useEffect(() => {
    if (report && !initialized.current) {
      initialized.current = true;
      setChecklist(report.checklist || []);
      setNotes(report.notes || "");
      setMood(report.mood);
    }
  }, [report]);

  const toggleChecklist = useCallback((index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)),
    );
  }, []);

  const handleSubmit = useCallback(() => {
    submitMutation.mutate(
      { checklist, notes, mood },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 3000);
        },
      },
    );
  }, [checklist, notes, mood, submitMutation]);

  const completedCount = checklist.filter((i) => i.checked).length;
  const totalChecklist = checklist.length;
  const completionPct = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  const isAdmin = user?.role === 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">End of Day Report</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <Tabs defaultValue="my-report">
        <TabsList>
          <TabsTrigger value="my-report">My Report</TabsTrigger>
          {isAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-report" className="space-y-6 mt-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CARDS.map((stat) => (
              <Card key={stat.key}>
                <CardContent className="py-4 px-4 flex flex-col items-center text-center">
                  <stat.icon className={cn("h-5 w-5 mb-1.5", stat.color)} />
                  <span className="text-2xl font-bold tabular-nums">
                    {isLoading ? "\u2014" : report?.stats[stat.key] ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checklist */}
          <Card>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Daily Checklist</h3>
                <Badge variant={completionPct === 100 ? "default" : "secondary"} className="text-xs">
                  {completedCount}/{totalChecklist}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-muted mb-4">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    completionPct === 100 ? "bg-green-500" : "bg-primary",
                  )}
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              <div className="space-y-2.5">
                {checklist.map((item, i) => (
                  <label
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50",
                      item.checked && "bg-muted/30",
                    )}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklist(i)}
                    />
                    <span
                      className={cn(
                        "text-sm transition-all",
                        item.checked && "line-through text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.checked && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto" />}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mood */}
          <Card>
            <CardContent className="py-4 px-5">
              <h3 className="text-sm font-semibold mb-3">How was your day?</h3>
              <div className="flex items-center justify-center gap-4">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMood(mood === opt.value ? null : opt.value)}
                    title={opt.label}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                      mood === opt.value
                        ? "bg-muted ring-2 ring-primary/50 scale-110"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <opt.icon className={cn("h-7 w-7 transition-colors", mood === opt.value ? opt.color : "text-muted-foreground")} />
                    <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="py-4 px-5">
              <h3 className="text-sm font-semibold mb-3">Reflection Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What went well today? What could improve? Any blockers?"
                rows={4}
                className="resize-none text-sm"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {submitted ? (
                <span className="text-green-500 font-medium">Report saved!</span>
              ) : (
                "Save your progress at any time"
              )}
            </p>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </TabsContent>

        {/* Team Tab */}
        {isAdmin && (
          <TabsContent value="team" className="mt-4">
            <div className="space-y-3">
              {!teamReports?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No team reports submitted for today yet.
                </p>
              ) : (
                teamReports.map((r: EodReportType) => {
                  const completed = r.checklist?.filter((c) => c.checked).length ?? 0;
                  const total = r.checklist?.length ?? 0;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  const moodOpt = MOOD_OPTIONS.find((m) => m.value === r.mood);

                  return (
                    <Card key={r._id}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{r.user_name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>Checklist: {completed}/{total} ({pct}%)</span>
                              <span>DMs: {r.stats.dms_sent}</span>
                              <span>Replies: {r.stats.replies_received}</span>
                              <span>Bookings: {r.stats.bookings_made}</span>
                            </div>
                            {r.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                                "{r.notes}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {moodOpt && <moodOpt.icon className={cn("h-5 w-5", moodOpt.color)} />}
                            <Badge variant={pct === 100 ? "default" : "secondary"} className="text-xs">
                              {pct}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
