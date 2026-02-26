import type React from "react"
import {
  Building2,
  ChevronsUpDown,
  Check,
  Eye,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useNavSections } from "@/hooks/useNavSections"
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

  const sections = useNavSections()

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
        {sections.map((section, i) => (
          <NavMain key={section.label || i} label={section.label} items={section.items} />
        ))}
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
