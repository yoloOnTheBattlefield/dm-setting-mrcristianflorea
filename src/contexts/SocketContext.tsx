import { API_URL } from "@/lib/api";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
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

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadLeadCount, setUnreadLeadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.account_id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join:account", user.account_id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("notification:lead", ({ notification }: { notification: LeadNotification }) => {
      setUnreadLeadCount((n) => n + 1);
      toast(notification.title, {
        description: notification.message,
        duration: 6000,
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.account_id]);

  const resetUnreadLeadCount = () => setUnreadLeadCount(0);

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
