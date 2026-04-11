import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminViewProvider } from "@/contexts/AdminViewContext";
import { SocketProvider } from "@/contexts/SocketContext";
import {
  coreRoutes,
  outboundRoutes,
  researchRoutes,
  settingsRoutes,
  publicRoutes,
} from "@/routes";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors
        if (error instanceof Error && /^(4\d\d):/.test(error.message)) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const allRoutes = [
  ...coreRoutes,
  ...outboundRoutes,
  ...researchRoutes,
  ...settingsRoutes,
  ...publicRoutes,
];

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="dm-pipeline-theme">
    <AuthProvider>
      <AdminViewProvider>
      <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
            <Routes>
              {allRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </SocketProvider>
      </AdminViewProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
