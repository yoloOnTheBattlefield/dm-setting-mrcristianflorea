import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./AuthContext"

interface AdminViewContextType {
  viewAll: boolean
  toggleViewAll: () => void
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined)

const STORAGE_KEY = "admin-view-all"

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 0

  const [viewAll, setViewAll] = useState<boolean>(() => {
    if (!isAdmin) return false
    try {
      return localStorage.getItem(STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  // Reset to false when user is not admin
  useEffect(() => {
    if (!isAdmin) setViewAll(false)
  }, [isAdmin])

  const toggleViewAll = () => {
    setViewAll((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }

  return (
    <AdminViewContext.Provider value={{ viewAll: isAdmin ? viewAll : false, toggleViewAll }}>
      {children}
    </AdminViewContext.Provider>
  )
}

export function useAdminView() {
  const context = useContext(AdminViewContext)
  if (context === undefined) {
    throw new Error("useAdminView must be used within an AdminViewProvider")
  }
  return context
}
