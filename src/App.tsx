import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PageSkeleton } from "@/components/PageSkeleton";
import { LoginForm } from "@/components/login-form";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminViewProvider } from "@/contexts/AdminViewContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

// Lazy-loaded page components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NewClient = lazy(() => import("./pages/NewClient"));
const ClientsOverview = lazy(() => import("./pages/ClientsOverview"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const AllContacts = lazy(() => import("./pages/AllContacts"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const Integrations = lazy(() => import("./pages/Integrations"));
const TeamMembers = lazy(() => import("./pages/TeamMembers"));
const UploadXlsx = lazy(() => import("./pages/UploadXlsx"));
const OutboundLeads = lazy(() => import("./pages/OutboundLeads"));
const ImportOutboundLeads = lazy(() => import("./pages/ImportOutboundLeads"));
const Prompts = lazy(() => import("./pages/Prompts"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignDetail = lazy(() => import("./components/campaigns/CampaignDetail"));
const CampaignAddLeads = lazy(() => import("./pages/CampaignAddLeads"));
const CampaignEdit = lazy(() => import("./pages/CampaignEdit"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const OutboundAccounts = lazy(() => import("./pages/OutboundAccounts"));
const OutboundAnalytics = lazy(() => import("./pages/OutboundAnalytics"));
const InboundAnalytics = lazy(() => import("./pages/InboundAnalytics"));
const Scraper = lazy(() => import("./pages/Scraper"));
const DeepScraper = lazy(() => import("./pages/DeepScraper"));
const CommentPost = lazy(() => import("./pages/CommentPost"));
const DataMigration = lazy(() => import("./pages/DataMigration"));
const ResearchOverview = lazy(() => import("./pages/research/ResearchOverview"));
const ResearchCompetitors = lazy(() => import("./pages/research/Competitors"));
const ResearchCompetitorDetail = lazy(() => import("./pages/research/CompetitorDetail"));
const ResearchPostsLibrary = lazy(() => import("./pages/research/PostsLibrary"));
const CommentsIntel = lazy(() => import("./pages/research/CommentsIntel"));
const LeadMagnetTracker = lazy(() => import("./pages/research/LeadMagnetTracker"));
const IdeasBank = lazy(() => import("./pages/research/IdeasBank"));
const ResearchAlerts = lazy(() => import("./pages/research/Alerts"));
const ResearchReports = lazy(() => import("./pages/research/Reports"));
const Landing = lazy(() => import("./pages/Landing"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

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
            <Suspense fallback={<PageSkeleton />}>
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
              <Route path="/analytics/inbound" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InboundAnalytics />
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
              <Route path="/follow-ups" element={
                <ProtectedRoute>
                  <RequireOutbound>
                    <DashboardLayout>
                      <FollowUps />
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
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/login" element={
                <div className="flex min-h-screen items-center justify-center">
                  <LoginForm />
                </div>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </SocketProvider>
      </AdminViewProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
