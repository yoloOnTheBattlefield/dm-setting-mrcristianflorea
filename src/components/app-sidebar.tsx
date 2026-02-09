import * as React from "react"
import {
  BarChart3,
  MessageSquare,
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
      disabled: true,
      items: [
        {
          title: "Funnel Metrics",
          url: "#",
        },
        {
          title: "Velocity",
          url: "#",
        },
        {
          title: "Daily Volume",
          url: "#",
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

    // Add "Clients" dropdown for admins (role === 0)
    if (user?.role === 0) {
      items.splice(1, 0, {
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
      })

      // Add admin-only items under Contacts
      const contactsSection = items.find((item) => item.title === "Contacts")
      if (contactsSection?.items) {
        contactsSection.items.push(
          {
            title: "Outbound Leads",
            url: "/outbound-leads",
          },
          {
            title: "Upload",
            url: "/contacts/upload",
          },
        )
      }
    }

    return items
  }, [user?.role])

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
