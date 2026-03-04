import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  type LucideIcon,
  BarChart3,
  Building2,
  Database,
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

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  disabled?: boolean
  items?: { title: string; url: string }[]
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export function useNavSections(): NavSection[] {
  const { user } = useAuth()

  return useMemo(() => {
    const sections: NavSection[] = []

    sections.push({
      items: [{ title: "Dashboard", url: "/", icon: BarChart3, isActive: true }],
    })

    sections.push({
      label: "Inbound",
      items: [
        { title: "Contacts", url: "/contacts/all", icon: Users },
        { title: "Analytics", url: "/analytics/inbound", icon: TrendingUp },
      ],
    })

    if (user?.has_outbound) {
      sections.push({
        label: "Acquisition",
        items: [
          { title: "Scraper", url: "/scraper", icon: Search },
          { title: "Deep Scraper", url: "/deep-scraper", icon: ScanSearch },
          { title: "Upload", url: "/contacts/upload", icon: Upload },
          { title: "Prompts", url: "/prompts", icon: MessageSquareText },
        ],
      })

      sections.push({
        label: "Outbound",
        items: [
          { title: "Leads", url: "/outbound-leads", icon: Users },
          { title: "Campaigns", url: "/campaigns", icon: Send },
          { title: "Accounts", url: "/outbound-accounts", icon: Building2 },
          { title: "Analytics", url: "/analytics/outbound", icon: TrendingUp },
        ],
      })
    }

    if (user?.has_research) {
      sections.push({
        items: [{
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
        }],
      })
    }

    sections.push({
      label: "Workspace",
      items: [
        { title: "Settings", url: "/settings", icon: Settings2 },
        { title: "Team", url: "/settings/team", icon: UsersRound },
        { title: "Integrations", url: "/settings/integrations", icon: Plug },
      ],
    })

    if (user?.role === 0) {
      sections.push({
        label: "Admin",
        items: [
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
        ],
      })
    }

    return sections
  }, [user?.role, user?.has_outbound, user?.has_research])
}

export function usePageTitle(pathname: string): string {
  const sections = useNavSections()

  return useMemo(() => {
    let bestMatch = ""
    let bestTitle = ""

    for (const section of sections) {
      for (const item of section.items) {
        if (item.url === "/" && pathname === "/") {
          return item.title
        }
        if (item.url !== "#" && item.url !== "/" && pathname.startsWith(item.url) && item.url.length > bestMatch.length) {
          bestMatch = item.url
          bestTitle = item.title
        }
        if (item.items) {
          for (const sub of item.items) {
            if (sub.url !== "#" && sub.url !== "/" && pathname.startsWith(sub.url) && sub.url.length > bestMatch.length) {
              bestMatch = sub.url
              bestTitle = sub.title
            }
          }
        }
      }
    }

    if (bestTitle) return bestTitle

    // Fallback: format the last path segment
    const segment = pathname.split("/").filter(Boolean).pop() || "Dashboard"
    return segment.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }, [sections, pathname])
}
