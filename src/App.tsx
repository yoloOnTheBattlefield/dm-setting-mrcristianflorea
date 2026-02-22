import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { LoginForm } from "@/components/login-form";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminViewProvider } from "@/contexts/AdminViewContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

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
                  <DashboardLayout>
                    <UploadXlsx />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/outbound-leads" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OutboundLeads />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/outbound-leads/import" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ImportOutboundLeads />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/prompts" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Prompts />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/outbound-accounts" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OutboundAccounts />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/analytics/outbound" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OutboundAnalytics />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Campaigns />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id/edit" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CampaignEdit />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id/add-leads" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CampaignAddLeads />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CampaignDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/scraper" element={<ProtectedRoute><DashboardLayout><Scraper /></DashboardLayout></ProtectedRoute>} />
              <Route path="/deep-scraper" element={<ProtectedRoute><DashboardLayout><DeepScraper /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research" element={<ProtectedRoute><DashboardLayout><ResearchOverview /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/competitors" element={<ProtectedRoute><DashboardLayout><ResearchCompetitors /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/competitors/:id" element={<ProtectedRoute><DashboardLayout><ResearchCompetitorDetail /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/posts" element={<ProtectedRoute><DashboardLayout><ResearchPostsLibrary /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/comments" element={<ProtectedRoute><DashboardLayout><CommentsIntel /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/lead-magnets" element={<ProtectedRoute><DashboardLayout><LeadMagnetTracker /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/ideas" element={<ProtectedRoute><DashboardLayout><IdeasBank /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/alerts" element={<ProtectedRoute><DashboardLayout><ResearchAlerts /></DashboardLayout></ProtectedRoute>} />
              <Route path="/research/reports" element={<ProtectedRoute><DashboardLayout><ResearchReports /></DashboardLayout></ProtectedRoute>} />
              <Route path="/data-migration" element={<ProtectedRoute><DashboardLayout><DataMigration /></DashboardLayout></ProtectedRoute>} />
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
