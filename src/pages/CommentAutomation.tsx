import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  useCommentRules,
  useCommentIgAccounts,
  useCommentEvents,
  useCreateCommentRule,
  useUpdateCommentRule,
  useDeleteCommentRule,
  type CommentRule,
  type CommentEventStatus,
  type MatchMode,
} from "@/hooks/useCommentRules";

interface FormState {
  ig_user_id: string;
  name: string;
  keywords: string;
  match_mode: MatchMode;
  dm_text: string;
  link_url: string;
  media_ids: string;
  reply_publicly: boolean;
  public_replies: string;
}

const EMPTY_FORM: FormState = {
  ig_user_id: "",
  name: "",
  keywords: "",
  match_mode: "partial",
  dm_text: "",
  link_url: "",
  media_ids: "",
  reply_publicly: false,
  public_replies: "",
};

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const STATUS_VARIANT: Record<CommentEventStatus, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  queued: "secondary",
  failed: "destructive",
  skipped: "outline",
};

export default function CommentAutomation() {
  const { toast } = useToast();
  const { data: rulesData, isLoading: rulesLoading } = useCommentRules();
  const { data: igData, isLoading: igLoading } = useCommentIgAccounts();
  const { data: eventsData } = useCommentEvents();

  const createRule = useCreateCommentRule();
  const updateRule = useUpdateCommentRule();
  const deleteRule = useDeleteCommentRule();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommentRule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<CommentRule | null>(null);

  const rules = rulesData?.rules ?? [];
  const igAccounts = igData?.accounts ?? [];
  const events = eventsData?.events ?? [];
  const hasIgAccount = igAccounts.length > 0;

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, ig_user_id: igAccounts[0]?.ig_user_id ?? "" });
    setIsDialogOpen(true);
  }

  function openEdit(rule: CommentRule) {
    setEditing(rule);
    setForm({
      ig_user_id: rule.ig_user_id,
      name: rule.name ?? "",
      keywords: rule.keywords.join(", "),
      match_mode: rule.match_mode,
      dm_text: rule.dm_text,
      link_url: rule.link_url ?? "",
      media_ids: rule.media_ids.join(", "),
      reply_publicly: rule.reply_publicly,
      public_replies: rule.public_replies.join("\n"),
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit() {
    const keywords = splitList(form.keywords);
    if (!form.ig_user_id || keywords.length === 0 || !form.dm_text.trim()) {
      toast({
        title: "Missing fields",
        description: "Pick an Instagram account, add at least one keyword, and write the DM.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ig_user_id: form.ig_user_id,
      name: form.name.trim() || null,
      keywords,
      match_mode: form.match_mode,
      dm_text: form.dm_text.trim(),
      link_url: form.link_url.trim() || null,
      media_ids: splitList(form.media_ids),
      reply_publicly: form.reply_publicly,
      public_replies: splitList(form.public_replies),
    };

    try {
      if (editing) {
        await updateRule.mutateAsync({ id: editing._id, ...payload });
        toast({ title: "Rule updated" });
      } else {
        await createRule.mutateAsync(payload);
        toast({ title: "Rule created" });
      }
      setIsDialogOpen(false);
      setEditing(null);
    } catch (err) {
      toast({
        title: editing ? "Could not update rule" : "Could not create rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleToggleActive(rule: CommentRule) {
    try {
      await updateRule.mutateAsync({ id: rule._id, active: !rule.active });
    } catch (err) {
      toast({
        title: "Could not update rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteRule.mutateAsync(pendingDelete._id);
      toast({ title: "Rule deleted" });
    } catch (err) {
      toast({
        title: "Could not delete rule",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPendingDelete(null);
    }
  }

  const isSaving = createRule.isPending || updateRule.isPending;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comment Automation</h1>
          <p className="text-muted-foreground text-sm">
            Auto-DM people who comment a keyword on your Instagram posts.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!hasIgAccount}>
          <Plus className="mr-2 h-4 w-4" />
          New rule
        </Button>
      </div>

      {!igLoading && !hasIgAccount && (
        <Card className="border-amber-500/50">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-base">No Instagram account connected</CardTitle>
              <CardDescription>
                Connect an Instagram Business account under Integrations before creating a rule.
                Already connected? Reconnect once so we can subscribe to comment events.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>
            The first matching rule wins. Instagram allows one private reply per comment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rules…
            </div>
          ) : rules.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
              <MessageSquarePlus className="h-6 w-6" />
              No rules yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead className="text-right">Matched</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule._id}>
                    <TableCell className="font-medium">{rule.name || "Untitled"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {rule.media_ids.length === 0 ? "All posts" : `${rule.media_ids.length} post(s)`}
                    </TableCell>
                    <TableCell className="text-right">{rule.matched_count}</TableCell>
                    <TableCell className="text-right">{rule.sent_count}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => handleToggleActive(rule)}
                        aria-label={`Toggle ${rule.name || "rule"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(rule)}
                          aria-label={`Edit ${rule.name || "rule"}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(rule)}
                          aria-label={`Delete ${rule.name || "rule"}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The last 50 comments that triggered a rule.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground py-6 text-sm">No activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commenter</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell className="font-medium">
                      {event.commenter_username ? `@${event.commenter_username}` : "—"}
                    </TableCell>
                    <TableCell>{event.matched_keyword ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                      {event.comment_text ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[event.status]}>{event.status}</Badge>
                      {event.error && (
                        <span className="text-destructive ml-2 text-xs">{event.error}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rule" : "New rule"}</DialogTitle>
            <DialogDescription>
              Use {"{{firstName}}"}, {"{{username}}"} and {"{{link}}"} in the DM. The link is
              tagged so clicks show up on the lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ig-account">Instagram account</Label>
              <Select
                value={form.ig_user_id}
                onValueChange={(value) => setForm({ ...form, ig_user_id: value })}
              >
                <SelectTrigger id="ig-account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {igAccounts.map((account) => (
                    <SelectItem key={account.ig_user_id} value={account.ig_user_id}>
                      @{account.ig_username ?? account.ig_user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-name">Name</Label>
              <Input
                id="rule-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Free guide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="guide, send, info"
              />
              <p className="text-muted-foreground text-xs">Comma separated.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-mode">Match</Label>
              <Select
                value={form.match_mode}
                onValueChange={(value) => setForm({ ...form, match_mode: value as MatchMode })}
              >
                <SelectTrigger id="match-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Anywhere in the comment</SelectItem>
                  <SelectItem value="whole">Whole word only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dm-text">DM</Label>
              <Textarea
                id="dm-text"
                rows={4}
                value={form.dm_text}
                onChange={(e) => setForm({ ...form, dm_text: e.target.value })}
                placeholder="Hey {{firstName}}, here's the guide: {{link}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-url">Link</Label>
              <Input
                id="link-url"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://example.com/guide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-ids">Limit to post IDs</Label>
              <Input
                id="media-ids"
                value={form.media_ids}
                onChange={(e) => setForm({ ...form, media_ids: e.target.value })}
                placeholder="Leave empty for all posts"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="reply-publicly">Also reply publicly</Label>
                <p className="text-muted-foreground text-xs">
                  Posts a public comment reply, picked at random from the list below.
                </p>
              </div>
              <Switch
                id="reply-publicly"
                checked={form.reply_publicly}
                onCheckedChange={(checked) => setForm({ ...form, reply_publicly: checked })}
              />
            </div>

            {form.reply_publicly && (
              <div className="space-y-2">
                <Label htmlFor="public-replies">Public replies</Label>
                <Textarea
                  id="public-replies"
                  rows={3}
                  value={form.public_replies}
                  onChange={(e) => setForm({ ...form, public_replies: e.target.value })}
                  placeholder={"Just sent it! 📩\nCheck your DMs 🙌"}
                />
                <p className="text-muted-foreground text-xs">One per line.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
            <AlertDialogDescription>
              New comments will stop triggering it. Past activity is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
