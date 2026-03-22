import { API_URL } from "@/lib/api";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SOCKET_URL = API_URL;

interface LeadNotification {
  _id: string;
  type: "new_lead" | "lead_replied";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadLeadCount: number;
  resetUnreadLeadCount: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 2000;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadLeadCount, setUnreadLeadCount] = useState(0);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.account_id) return null;

    const token = localStorage.getItem("token");
    if (!token) return null;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY_MS,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      socket.emit("join:account", user.account_id);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      // Server-initiated disconnect (e.g. token expired) — don't auto-reconnect
      if (reason === "io server disconnect") {
        socket.connect(); // manual reconnect attempt
      }
    });

    socket.on("connect_error", (error) => {
      reconnectAttempts.current += 1;
      // If auth error, force re-login
      if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        socket.disconnect();
        logout();
        return;
      }
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        toast.error("Lost connection to server. Please refresh the page.");
      }
    });

    socket.on("notification:lead", ({ notification }: { notification: LeadNotification }) => {
      setUnreadLeadCount((n) => n + 1);
      toast(notification.title, {
        description: notification.message,
        duration: 6000,
      });
    });

    // Handle token refresh — server can emit this when token is about to expire
    socket.on("auth:refresh", () => {
      const freshToken = localStorage.getItem("token");
      if (freshToken) {
        socket.auth = { token: freshToken };
        socket.disconnect().connect();
      }
    });

    return socket;
  }, [isAuthenticated, user?.account_id, logout]);

  useEffect(() => {
    // Clean up previous socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }

    if (!isAuthenticated || !user?.account_id) return;

    const socket = connect();
    if (socket) {
      socketRef.current = socket;
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.account_id, connect]);

  const resetUnreadLeadCount = useCallback(() => setUnreadLeadCount(0), []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, unreadLeadCount, resetUnreadLeadCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
