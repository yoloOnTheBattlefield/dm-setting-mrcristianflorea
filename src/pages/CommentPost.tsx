import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTasks, useCreateTasks } from "@/hooks/useTasks";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  in_progress: { label: "In Progress", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  completed: { label: "Completed", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export default function CommentPost() {
  const { toast } = useToast();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const createTasksMutation = useCreateTasks();

  // Form state
  const [target, setTarget] = useState("");
  const [comment, setComment] = useState("");
  const [batchUsernames, setBatchUsernames] = useState("");

  // Task list state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTasks({
    type: "comment_post",
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const tasks = data?.tasks ?? [];
  const pagination = data?.pagination;

  // Real-time updates via WebSocket
  const handleTaskUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;
    socket.on("task:completed", handleTaskUpdate);
    socket.on("task:failed", handleTaskUpdate);
    return () => {
      socket.off("task:completed", handleTaskUpdate);
      socket.off("task:failed", handleTaskUpdate);
    };
  }, [socket, handleTaskUpdate]);

  // Single send
  const handleSingleSend = async () => {
    const trimmedTarget = target.trim().replace(/^@/, "");
    const trimmedComment = comment.trim();
    if (!trimmedTarget || !trimmedComment) {
      toast({ title: "Error", description: "Username and comment are required.", variant: "destructive" });
      return;
    }
    try {
      const result = await createTasksMutation.mutateAsync([
        { target: trimmedTarget, message: trimmedComment, type: "comment_post" },
      ]);
      toast({ title: "Task Created", description: `Comment task queued for @${trimmedTarget}` });
      setTarget("");
      setComment("");
      setPage(1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    }
  };

  // Batch send
  const parsedUsernames = batchUsernames
    .split("\n")
    .map((u) => u.trim().replace(/^@/, ""))
    .filter(Boolean);

  const handleBatchSend = async () => {
    const trimmedComment = comment.trim();
    if (parsedUsernames.length === 0 || !trimmedComment) {
      toast({ title: "Error", description: "Usernames and comment are required.", variant: "destructive" });
      return;
    }
    try {
      const tasksToCreate = parsedUsernames.map((username) => ({
        target: username,
        message: trimmedComment,
        type: "comment_post",
      }));
      const result = await createTasksMutation.mutateAsync(tasksToCreate);
      toast({
        title: "Tasks Created",
        description: `${result.count} comment task${result.count !== 1 ? "s" : ""} queued`,
      });
      setBatchUsernames("");
      setComment("");
      setPage(1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tasks",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Comment on Post</h2>
        <p className="text-muted-foreground">
          Create tasks that navigate to a user's profile, click a random post, and type a comment
        </p>
      </div>

      {/* Create Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Comment Tasks</CardTitle>
          <CardDescription>
            The extension will visit each user's profile, open a random post from their top 9, and type the comment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="batch">Batch</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="target">Target Username</Label>
                <Input
                  id="target"
                  placeholder="username"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comment-single">Comment</Label>
                <Textarea
                  id="comment-single"
                  placeholder="Great content! {{username}}"
                  className="min-h-[80px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {"{{username}}"} gets replaced with the target's username at execution time
                </p>
              </div>
              <Button
                onClick={handleSingleSend}
                disabled={createTasksMutation.isPending || !target.trim() || !comment.trim()}
              >
                {createTasksMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Comment Task
              </Button>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="batch-usernames">Usernames (one per line)</Label>
                <Textarea
                  id="batch-usernames"
                  placeholder={"user1\nuser2\nuser3"}
                  className="min-h-[120px] font-mono text-sm"
                  value={batchUsernames}
                  onChange={(e) => setBatchUsernames(e.target.value)}
                />
                {parsedUsernames.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {parsedUsernames.length} username{parsedUsernames.length !== 1 ? "s" : ""} entered
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comment-batch">Comment Template</Label>
                <Textarea
                  id="comment-batch"
                  placeholder="Great content! {{username}}"
                  className="min-h-[80px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {"{{username}}"} gets replaced with each target's username at execution time
                </p>
              </div>
              <Button
                onClick={handleBatchSend}
                disabled={createTasksMutation.isPending || parsedUsernames.length === 0 || !comment.trim()}
              >
                {createTasksMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send {parsedUsernames.length || ""} Comment Task{parsedUsernames.length !== 1 ? "s" : ""}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Task List Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Comment Tasks</CardTitle>
            <CardDescription>
              Tasks update in real-time as the extension processes them
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={4} colWidths={["w-24", "w-48", "w-20", "w-28"]} />
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comment tasks yet. Create one above to get started.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const badge = STATUS_BADGES[task.status] ?? STATUS_BADGES.pending;
                    return (
                      <TableRow key={task._id}>
                        <TableCell className="font-medium">@{task.target}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                          {task.message || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
