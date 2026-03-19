import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useBookings,
  useBookingStats,
  useSyncBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  type Booking,
  type BookingStatus,
} from "@/hooks/useBookings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  Plus,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Shimmer } from "@/components/skeletons";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Clock },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle2 },
  no_show: { label: "No-Show", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertTriangle },
  cancelled: { label: "Cancelled", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: XCircle },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCurrency(val: number | null): string {
  if (val == null) return "\u2014";
  return `$${val.toLocaleString()}`;
}

export default function Bookings() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useBookings({ page, limit: 20, status, search, sort: "booking_date" });
  const { data: stats } = useBookingStats();
  const syncMutation = useSyncBookings();
  const createMutation = useCreateBooking();
  const updateMutation = useUpdateBooking();
  const deleteMutation = useDeleteBooking();

  // Auto-sync on mount
  const hasSynced = useRef(false);
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncMutation.mutateAsync().catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bookings = data?.bookings ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    updateMutation.mutate({ id, updates: { status: newStatus } });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({ title: "Booking deleted" });
      },
    });
  };

  // Create booking form state
  const [newBooking, setNewBooking] = useState({
    contact_name: "",
    ig_username: "",
    email: "",
    booking_date: "",
    source: "outbound" as "inbound" | "outbound",
    notes: "",
  });

  const handleCreate = () => {
    if (!newBooking.booking_date || !newBooking.contact_name.trim()) {
      toast({ title: "Name and date are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(newBooking, {
      onSuccess: () => {
        setCreateOpen(false);
        setNewBooking({ contact_name: "", ig_username: "", email: "", booking_date: "", source: "outbound", notes: "" });
        toast({ title: "Booking created" });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {stats?.total ?? 0} total
            {(stats?.today_count ?? 0) > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium"> · {stats!.today_count} today</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutateAsync().then((r) => toast({ title: `Synced ${r.synced} bookings` }))}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", syncMutation.isPending && "animate-spin")} />
            Sync
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Contact Name *</Label>
                  <Input value={newBooking.contact_name} onChange={(e) => setNewBooking((p) => ({ ...p, contact_name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">IG Username</Label>
                    <Input value={newBooking.ig_username} onChange={(e) => setNewBooking((p) => ({ ...p, ig_username: e.target.value }))} placeholder="@handle" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={newBooking.email} onChange={(e) => setNewBooking((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Booking Date *</Label>
                    <Input type="datetime-local" value={newBooking.booking_date} onChange={(e) => setNewBooking((p) => ({ ...p, booking_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Source</Label>
                    <Select value={newBooking.source} onValueChange={(v) => setNewBooking((p) => ({ ...p, source: v as "inbound" | "outbound" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outbound">Outbound</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={newBooking.notes} onChange={(e) => setNewBooking((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." rows={2} className="resize-none" />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["scheduled", "completed", "no_show", "cancelled"] as BookingStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <Card key={s} className={cn("cursor-pointer transition-colors", status === s && "ring-2 ring-primary/50")} onClick={() => setStatus(status === s ? "all" : s)}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <cfg.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold tabular-nums">{stats?.[s] ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className={cn("cursor-pointer transition-colors border-blue-500/30", status === "all" && "ring-2 ring-primary/50")} onClick={() => setStatus("all")}>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <CalendarCheck className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-bold tabular-nums">{stats?.today_count ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search bookings..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-xs max-w-sm" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Contract</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {["w-28", "w-20", "w-20", "w-16", "w-14", "w-14", "w-10"].map((w, j) => (
                    <TableCell key={j}><Shimmer className={`h-4 ${w}`} delay={`${(i * 7 + j) * 25}ms`} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b: Booking) => {
                const cfg = STATUS_CONFIG[b.status];
                const displayName = b.contact_name || b.outbound_lead?.fullName || b.outbound_lead?.username || b.lead?.first_name || "Unknown";
                const igHandle = b.ig_username || b.outbound_lead?.username;

                return (
                  <TableRow key={b._id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {igHandle && (
                          <a
                            href={`https://instagram.com/${igHandle}`}
                            target="_blank" rel="noopener noreferrer"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted-foreground hover:underline flex items-center gap-0.5"
                          >
                            @{igHandle} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{formatDate(b.booking_date)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(b.booking_date)}</p>
                    </TableCell>
                    <TableCell>
                      <Select value={b.status} onValueChange={(v) => handleStatusChange(b._id, v as BookingStatus)}>
                        <SelectTrigger className="h-7 text-xs w-[120px]">
                          <Badge variant="secondary" className={cn("text-[10px] font-medium", cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {b.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(b.cash_collected)}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(b.contract_value)}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setDeleteId(b._id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} bookings
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
