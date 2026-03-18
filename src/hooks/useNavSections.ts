import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useFollowUpStats } from "@/hooks/useFollowUps"
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
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  disabled?: boolean
  badge?: number
  description?: string
  items?: { title: string; url: string; description?: string }[]
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export function useNavSections(): NavSection[] {
  const { user } = useAuth()
  const { data: followUpStats } = useFollowUpStats()
  const followUpBadge = (followUpStats?.new ?? 0) + (followUpStats?.contacted ?? 0) + (followUpStats?.hot_lead ?? 0)

  return useMemo(() => {
    const sections: NavSection[] = []

    sections.push({
      items: [{ title: "Dashboard", url: "/", icon: BarChart3, isActive: true, description: "Track and analyze your DM pipeline performance" }],
    })

    sections.push({
      label: "Inbound",
      items: [
        { title: "Contacts", url: "/contacts/all", icon: Users, description: "View and manage all your contacts" },
        { title: "Analytics", url: "/analytics/inbound", icon: TrendingUp, description: "Track which posts and sources drive the most leads and revenue" },
      ],
    })

    if (user?.has_outbound) {
      sections.push({
        label: "Acquisition",
        items: [
          { title: "Scraper", url: "/scraper", icon: Search, description: "Scrape Instagram followers" },
          { title: "Deep Scraper", url: "/deep-scraper", icon: ScanSearch, description: "Scrape reels, comments, and commenter profiles via Apify" },
          { title: "Upload", url: "/contacts/upload", icon: Upload, description: "Upload IG scraper exports to qualify and import profiles" },
          { title: "Prompts", url: "/prompts", icon: MessageSquareText, description: "Manage classification prompts for lead qualification" },
        ],
      })

      sections.push({
        label: "Outbound",
        items: [
          { title: "Leads", url: "/outbound-leads", icon: Users, description: "Manage your outbound leads pipeline" },
          { title: "Follow-Ups", url: "/follow-ups", icon: UserCheck, badge: followUpBadge || undefined, description: "Track and manage lead follow-ups" },
          { title: "Campaigns", url: "/campaigns", icon: Send, description: "Manage your outbound campaigns" },
          { title: "Accounts", url: "/outbound-accounts", icon: Building2, description: "Manage outbound Instagram accounts, credentials, and proxies" },
          { title: "Analytics", url: "/analytics/outbound", icon: TrendingUp, description: "Performance metrics across your outbound pipeline" },
        ],
      })
    }

    if (user?.has_research) {
      sections.push({
        label: "Research",
        items: [{
          title: "Research",
          url: "#",
          icon: Telescope,
          items: [
            { title: "Overview", url: "/research", description: "Instagram intelligence dashboard" },
            { title: "Scraper", url: "/deep-scraper", description: "Scrape reels, comments, and commenter profiles via Apify" },
            { title: "Competitors", url: "/research/competitors", description: "Track and analyze competitor accounts" },
            { title: "Posts Library", url: "/research/posts", description: "Your Instagram research swipe file" },
            { title: "Comments Intel", url: "/research/comments", description: "Keyword radar, commenter patterns, and theme analysis" },
            { title: "Lead Magnets", url: "/research/lead-magnets", description: "Track competitor lead magnets and keyword funnels" },
            { title: "Ideas Bank", url: "/research/ideas", description: "Save and organize content ideas from research" },
            { title: "Alerts", url: "/research/alerts", description: "Stay updated on competitor activity and keyword spikes" },
            { title: "Reports", url: "/research/reports", description: "Generate client-ready research reports" },
          ],
        }],
      })
    }

    sections.push({
      label: "Workspace",
      items: [
        { title: "Settings", url: "/settings", icon: Settings2, description: "Manage your account settings" },
        { title: "Team", url: "/settings/team", icon: UsersRound, description: "Manage your team members" },
        { title: "Integrations", url: "/settings/integrations", icon: Plug, description: "Connect and manage your third-party integrations" },
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
  }, [user?.role, user?.has_outbound, user?.has_research, followUpBadge])
}

export function usePageTitle(pathname: string): string {
  const { title } = usePageInfo(pathname)
  return title
}

export function usePageInfo(pathname: string): { title: string; description?: string } {
  const sections = useNavSections()

  return useMemo(() => {
    let bestMatch = ""
    let bestTitle = ""
    let bestDescription: string | undefined

    for (const section of sections) {
      for (const item of section.items) {
        if (item.url === "/" && pathname === "/") {
          return { title: item.title, description: item.description }
        }
        if (item.url !== "#" && item.url !== "/" && pathname.startsWith(item.url) && item.url.length > bestMatch.length) {
          bestMatch = item.url
          bestTitle = item.title
          bestDescription = item.description
        }
        if (item.items) {
          for (const sub of item.items) {
            if (sub.url !== "#" && sub.url !== "/" && pathname.startsWith(sub.url) && sub.url.length > bestMatch.length) {
              bestMatch = sub.url
              bestTitle = sub.title
              bestDescription = sub.description
            }
          }
        }
      }
    }

    if (bestTitle) return { title: bestTitle, description: bestDescription }

    // Known detail routes — show a friendly title instead of the raw ID
    if (pathname.startsWith("/lead/")) return { title: "Lead Detail" }

    // Fallback: format the last path segment
    const segment = pathname.split("/").filter(Boolean).pop() || "Dashboard"
    const title = segment.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    return { title }
  }, [sections, pathname])
}
