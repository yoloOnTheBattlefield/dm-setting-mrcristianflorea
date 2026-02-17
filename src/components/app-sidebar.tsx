import * as React from "react"
import {
  BarChart3,
  MessageSquare,
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

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
          title: "Booked",
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
  const { user } = useAuth()

  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: "/avatars/user.jpg",
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
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
