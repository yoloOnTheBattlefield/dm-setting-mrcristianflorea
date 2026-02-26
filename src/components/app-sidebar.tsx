import * as React from "react"
import {
  BarChart3,
  Building2,
  ChevronsUpDown,
  Check,
  Database,
  Eye,
  MessageSquareText,
  Plug,
  ScanSearch,
  Search,
  Send,
  Settings2,
  Telescope,
  TrendingUp,
  Upload,
  Users,
  UserPlus,
  UsersRound,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useAdminView } from "@/contexts/AdminViewContext"
import { useToast } from "@/hooks/use-toast"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, accounts, switchAccount } = useAuth()
  const { viewAll, toggleViewAll } = useAdminView()
  const { toast } = useToast()
  const isAdmin = user?.role === 0

  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: "/avatars/user.jpg",
  }

  const currentAccount = accounts.find((a) => a.account_id === user?.account_id)
  const showSwitcher = accounts.length > 1

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === user?.account_id) return
    try {
      await switchAccount(accountId)
      toast({ title: "Account switched", description: "You are now viewing a different account." })
    } catch {
      toast({ title: "Switch failed", description: "Could not switch accounts.", variant: "destructive" })
    }
  }

  // Build navigation sections based on user permissions
  const sections = React.useMemo(() => {
    const dashboardItems = [
      { title: "Dashboard", url: "/", icon: BarChart3, isActive: true },
    ]

    const acquisitionItems = user?.has_outbound ? [
      { title: "Scraper", url: "/scraper", icon: Search },
      { title: "Deep Scraper", url: "/deep-scraper", icon: ScanSearch },
      { title: "Upload", url: "/contacts/upload", icon: Upload },
      { title: "Prompts", url: "/prompts", icon: MessageSquareText },
    ] : []

    const outboundItems = user?.has_outbound ? [
      { title: "Leads", url: "/outbound-leads", icon: Users },
      { title: "Campaigns", url: "/campaigns", icon: Send },
      { title: "Accounts", url: "/outbound-accounts", icon: Building2 },
      { title: "Analytics", url: "/analytics/outbound", icon: TrendingUp },
    ] : []

    const researchItems = user?.has_research ? [
      {
        title: "Research",
        url: "#",
        icon: Telescope,
        items: [
          { title: "Overview", url: "/research" },
          { title: "Scraper", url: "/deep-scraper" },
          { title: "Competitors", url: "/research/competitors" },
          { title: "Posts Library", url: "/research/posts" },
          { title: "Comments Intel", url: "/research/comments" },
          { title: "Lead Magnets", url: "/research/lead-magnets" },
          { title: "Ideas Bank", url: "/research/ideas" },
          { title: "Alerts", url: "/research/alerts" },
          { title: "Reports", url: "/research/reports" },
        ],
      },
    ] : []

    const workspaceItems = [
      { title: "Settings", url: "/settings", icon: Settings2 },
      { title: "Team", url: "/settings/team", icon: UsersRound },
      { title: "Integrations", url: "/settings/integrations", icon: Plug },
    ]

    const adminItems = user?.role === 0 ? [
      {
        title: "Clients",
        url: "#",
        icon: UserPlus,
        items: [
          { title: "New Client", url: "/clients/new" },
          { title: "Clients Overview", url: "/clients" },
        ],
      },
      { title: "Data Migration", url: "/data-migration", icon: Database },
    ] : []

    return { dashboardItems, acquisitionItems, outboundItems, researchItems, workspaceItems, adminItems }
  }, [user?.role, user?.has_outbound, user?.has_research])

  return (
    <Sidebar collapsible="icon" {...props}>
      {showSwitcher && (
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {currentAccount?.name || "Account"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Accounts
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accounts.map((acc) => (
                    <DropdownMenuItem
                      key={acc.account_id}
                      onClick={() => handleSwitchAccount(acc.account_id)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Building2 className="size-4 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">{acc.name}</span>
                      {acc.account_id === user?.account_id && (
                        <Check className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      )}
      <SidebarContent>
        <NavMain items={sections.dashboardItems} />
        {sections.acquisitionItems.length > 0 && (
          <NavMain label="Acquisition" items={sections.acquisitionItems} />
        )}
        {sections.outboundItems.length > 0 && (
          <NavMain label="Outbound" items={sections.outboundItems} />
        )}
        {sections.researchItems.length > 0 && (
          <NavMain items={sections.researchItems} />
        )}
        <NavMain label="Workspace" items={sections.workspaceItems} />
        {sections.adminItems.length > 0 && (
          <NavMain label="Admin" items={sections.adminItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isAdmin && (
          <button
            onClick={toggleViewAll}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-sidebar-accent"
          >
            <Eye className="h-4 w-4" />
            <span>{viewAll ? "All Clients" : "My Data"}</span>
            <span
              className={`ml-auto inline-block h-2 w-2 rounded-full ${viewAll ? "bg-green-500" : "bg-muted-foreground"}`}
            />
          </button>
        )}
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
