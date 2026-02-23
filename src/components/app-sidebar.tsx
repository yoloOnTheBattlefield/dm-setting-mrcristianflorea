import * as React from "react"
import {
  BarChart3,
  Building2,
  ChevronsUpDown,
  Check,
  Database,
  Eye,
  MessageSquare,
  MessageSquareText,
  Send,
  Settings2,
  Telescope,
  TrendingUp,
  Users,
  UserPlus,
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

const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "#",
      icon: TrendingUp,
      items: [
        {
          title: "Outbound",
          url: "/analytics/outbound",
        },
      ],
    },
    {
      title: "Contacts",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Contacts",
          url: "/contacts/all",
        },
        {
          title: "Converted",
          url: "#",
        },
      ],
    },
    {
      title: "Messages",
      url: "#",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "User Settings",
          url: "/settings",
        },
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
      ],
    },
]

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

  // Build navigation items based on user role
  const navigationItems = React.useMemo(() => {
    const items = [...navMain]

    // Add admin-only nav items (role === 0)
    if (user?.role === 0) {
      items.splice(1, 0,
        {
          title: "Clients",
          url: "#",
          icon: UserPlus,
          items: [
            {
              title: "New Client",
              url: "/clients/new",
            },
            {
              title: "Clients Overview",
              url: "/clients",
            },
          ],
        },
        {
          title: "Data Migration",
          url: "/data-migration",
          icon: Database,
        },
      )
    }

    // Add outbound nav items for users with outbound access
    if (user?.has_outbound) {
      items.splice(user?.role === 0 ? 2 : 1, 0,
        {
          title: "Outbound",
          url: "#",
          icon: Send,
          items: [
            {
              title: "Campaigns",
              url: "/campaigns",
            },
            {
              title: "Leads",
              url: "/outbound-leads",
            },
            {
              title: "Accounts",
              url: "/outbound-accounts",
            },
            {
              title: "Prompts",
              url: "/prompts",
            },
            {
              title: "Comment Post",
              url: "/comment-post",
            },
            {
              title: "Scraper",
              url: "/scraper",
            },
            {
              title: "Deep Scraper",
              url: "/deep-scraper",
            },
            {
              title: "Upload",
              url: "/contacts/upload",
            },
          ],
        },
      )
    }

    // Add research nav items for users with research access
    if (user?.has_research) {
      // Insert before Settings (last item)
      items.splice(items.length - 1, 0,
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
      )
    }

    return items
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
        <NavMain items={navigationItems} />
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
