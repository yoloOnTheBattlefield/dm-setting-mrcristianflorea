import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { unreadLeadCount, resetUnreadLeadCount } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/notifications`);
      if (!res.ok) return;
      const data = await res.json();
      const leadNotifs = (data.notifications as Notification[]).filter(
        (n) => n.type === "new_lead" || n.type === "lead_replied",
      );
      setNotifications(leadNotifs);
      setUnreadCount(leadNotifs.filter((n) => !n.read).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh list when a new socket event arrives
  useEffect(() => {
    if (unreadLeadCount > 0) {
      fetchNotifications();
    }
  }, [unreadLeadCount]);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      try {
        await fetchWithAuth(`${API_URL}/api/notifications/read-all`, { method: "POST" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        resetUnreadLeadCount();
      } catch {
        // silent
      }
    }
  };

  const totalUnread = unreadCount + unreadLeadCount;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Lead Notifications</p>
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`border-b px-4 py-3 last:border-0 ${!n.read ? "bg-muted/40" : ""}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
