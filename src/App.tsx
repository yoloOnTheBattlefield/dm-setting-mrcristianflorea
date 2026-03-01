import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewClient from "./pages/NewClient";
import ClientsOverview from "./pages/ClientsOverview";
import ClientDetail from "./pages/ClientDetail";
import AllContacts from "./pages/AllContacts";
import LeadDetail from "./pages/LeadDetail";
import UserSettings from "./pages/UserSettings";
import Integrations from "./pages/Integrations";
import TeamMembers from "./pages/TeamMembers";
import UploadXlsx from "./pages/UploadXlsx";
import OutboundLeads from "./pages/OutboundLeads";
import ImportOutboundLeads from "./pages/ImportOutboundLeads";
import Prompts from "./pages/Prompts";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./components/campaigns/CampaignDetail";
import CampaignAddLeads from "./pages/CampaignAddLeads";
import CampaignEdit from "./pages/CampaignEdit";
import OutboundAccounts from "./pages/OutboundAccounts";
import OutboundAnalytics from "./pages/OutboundAnalytics";
import Scraper from "./pages/Scraper";
import DeepScraper from "./pages/DeepScraper";
import CommentPost from "./pages/CommentPost";
import DataMigration from "./pages/DataMigration";
import ResearchOverview from "./pages/research/ResearchOverview";
import ResearchCompetitors from "./pages/research/Competitors";
import ResearchCompetitorDetail from "./pages/research/CompetitorDetail";
import ResearchPostsLibrary from "./pages/research/PostsLibrary";
import CommentsIntel from "./pages/research/CommentsIntel";
import LeadMagnetTracker from "./pages/research/LeadMagnetTracker";
import IdeasBank from "./pages/research/IdeasBank";
import ResearchAlerts from "./pages/research/Alerts";
import ResearchReports from "./pages/research/Reports";
import Landing from "./pages/Landing";
import { LoginForm } from "@/components/login-form";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminViewProvider } from "@/contexts/AdminViewContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function RequireOutbound({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.has_outbound) return <Navigate to="/" replace />;
  return <>{children}</>;
}

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
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Index />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/clients/new" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <NewClient />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ClientsOverview />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/clients/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ClientDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/contacts/all" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AllContacts />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/lead/:contactId" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeadDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UserSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings/integrations" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Integrations />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings/team" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeamMembers />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/contacts/upload" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <UploadXlsx />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/outbound-leads" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <OutboundLeads />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/outbound-leads/import" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <ImportOutboundLeads />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/prompts" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <Prompts />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/outbound-accounts" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <OutboundAccounts />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/analytics/outbound" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <OutboundAnalytics />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <Campaigns />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id/edit" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <CampaignEdit />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id/add-leads" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <CampaignAddLeads />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <CampaignDetail />
                    </DashboardLayout>
                  </RequireOutbound>
                </ProtectedRoute>
              } />
              <Route path="/scraper" element={<ProtectedRoute><RequireOutbound><DashboardLayout><Scraper /></DashboardLayout></RequireOutbound></ProtectedRoute>} />
              <Route path="/deep-scraper" element={<ProtectedRoute><RequireOutbound><DashboardLayout><DeepScraper /></DashboardLayout></RequireOutbound></ProtectedRoute>} />
              <Route path="/research" element={<ProtectedRoute><DashboardLayout><ResearchOverview /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/competitors" element={<ProtectedRoute><DashboardLayout><ResearchCompetitors /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/competitors/:id" element={<ProtectedRoute><DashboardLayout><ResearchCompetitorDetail /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/posts" element={<ProtectedRoute><DashboardLayout><ResearchPostsLibrary /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/comments" element={<ProtectedRoute><DashboardLayout><CommentsIntel /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/lead-magnets" element={<ProtectedRoute><DashboardLayout><LeadMagnetTracker /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/ideas" element={<ProtectedRoute><DashboardLayout><IdeasBank /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/alerts" element={<ProtectedRoute><DashboardLayout><ResearchAlerts /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/reports" element={<ProtectedRoute><DashboardLayout><ResearchReports /></DashboardLayout></ProtectedRoute>} />
              <Route path="/comment-post" element={<ProtectedRoute><RequireOutbound><DashboardLayout><CommentPost /></DashboardLayout></RequireOutbound></ProtectedRoute>} />
              <Route path="/data-migration" element={<ProtectedRoute><DashboardLayout><DataMigration /></DashboardLayout></ProtectedRoute>} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={
                <div className="flex min-h-screen items-center justify-center">
                  <LoginForm />
                </div>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </SocketProvider>
      </AdminViewProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
