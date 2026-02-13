import * as React from "react"
import {
  BarChart3,
  MessageSquare,
  Send,
  Settings2,
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
              title: "Browsers",
              url: "/senders",
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

    return items
  }, [user?.role, user?.has_outbound])

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
