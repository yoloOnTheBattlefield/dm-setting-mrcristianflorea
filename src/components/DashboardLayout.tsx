import { useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { usePageInfo } from "@/hooks/useNavSections"
import { NotificationBell } from "@/components/NotificationBell"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation()
  const { title, description } = usePageInfo(pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 bg-background opacity-100 flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold leading-tight truncate">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground leading-tight truncate">{description}</p>
            )}
          </div>
          <NotificationBell />
        </header>
        <main className="flex flex-1 flex-col min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
