import { API_URL } from "@/lib/api"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { queryClient } from "@/App"

export interface AccountMembership {
  account_id: string
  name: string
  ghl?: string
  role: number
  has_outbound: boolean
  has_research: boolean
  is_default: boolean
}

export interface LeadVisibility {
  dms: boolean
  outbound: boolean
}

interface User {
  id?: string
  account_id?: string
  ghl?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role?: number
  api_key?: string
  has_outbound?: boolean
  has_research?: boolean
  lead_visibility?: LeadVisibility
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  accounts: AccountMembership[]
  login: (email: string, firstName?: string, lastName?: string, id?: string, account_id?: string, ghl?: string, role?: number, api_key?: string, has_outbound?: boolean, token?: string, has_research?: boolean, accounts?: AccountMembership[], lead_visibility?: LeadVisibility) => void
  updateUser: (updates: Partial<User>) => void
  switchAccount: (accountId: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<AccountMembership[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    const userDataString = localStorage.getItem("user")
    const accountsString = localStorage.getItem("accounts")
    const token = localStorage.getItem("token")

    if (authStatus === "true" && userDataString && token) {
      setIsAuthenticated(true)
      const parsed = JSON.parse(userDataString)
      if (parsed.has_research === undefined) parsed.has_research = true
      if (!parsed.lead_visibility) parsed.lead_visibility = { dms: true, outbound: true }
      setUser(parsed)
      if (accountsString) {
        try { setAccounts(JSON.parse(accountsString)) } catch { /* ignore */ }
      }
    }
    setLoading(false)
  }, [])

  const login = (email: string, firstName?: string, lastName?: string, id?: string, account_id?: string, ghl?: string, role?: number, api_key?: string, has_outbound?: boolean, token?: string, has_research?: boolean, accts?: AccountMembership[], lead_visibility?: LeadVisibility) => {
    const fullName = firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || email.split('@')[0]

    const userData: User = {
      id,
      account_id,
      ghl,
      email,
      firstName,
      lastName,
      name: fullName,
      role,
      api_key,
      has_outbound,
      has_research: has_research ?? true,
      lead_visibility: lead_visibility ?? { dms: true, outbound: true },
    }

    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("user", JSON.stringify(userData))
    if (token) localStorage.setItem("token", token)
    if (accts) localStorage.setItem("accounts", JSON.stringify(accts))
    setIsAuthenticated(true)
    setUser(userData)
    if (accts) setAccounts(accts)
  }

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      if (updates.firstName || updates.lastName) {
        updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim()
      }
      localStorage.setItem("user", JSON.stringify(updated))
      return updated
    })
  }

  const switchAccount = useCallback(async (accountId: string) => {
    const token = localStorage.getItem("token")
    if (!token) return

    const response = await fetch(`${API_URL}/accounts/switch-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ account_id: accountId }),
    })

    if (!response.ok) throw new Error("Failed to switch account")

    const data = await response.json()

    const fullName = data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`
      : data.first_name || user?.email?.split('@')[0] || ""

    const userData: User = {
      id: data._id,
      account_id: data.account_id,
      ghl: data.ghl,
      email: user?.email || "",
      firstName: data.first_name,
      lastName: data.last_name,
      name: fullName,
      role: data.role,
      api_key: data.api_key,
      has_outbound: data.has_outbound,
      has_research: data.has_research ?? true,
      lead_visibility: data.lead_visibility ?? { dms: true, outbound: true },
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(userData))
    if (data.accounts) localStorage.setItem("accounts", JSON.stringify(data.accounts))
    queryClient.clear()
    setUser(userData)
    if (data.accounts) setAccounts(data.accounts)
  }, [user?.email])

  const logout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("accounts")
    queryClient.clear()
    setIsAuthenticated(false)
    setUser(null)
    setAccounts([])
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, accounts, login, updateUser, switchAccount, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
