import { createContext, useContext, useState, useEffect, ReactNode } from "react"

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
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: (email: string, firstName?: string, lastName?: string, id?: string, account_id?: string, ghl?: string, role?: number, api_key?: string, has_outbound?: boolean, token?: string, has_research?: boolean) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const authStatus = localStorage.getItem("isAuthenticated")
    const userDataString = localStorage.getItem("user")

    const token = localStorage.getItem("token")
    if (authStatus === "true" && userDataString && token) {
      setIsAuthenticated(true)
      const parsed = JSON.parse(userDataString)
      // Default has_research to true until backend controls it
      if (parsed.has_research === undefined) parsed.has_research = true
      setUser(parsed)
    }
    setLoading(false)
  }, [])

  const login = (email: string, firstName?: string, lastName?: string, id?: string, account_id?: string, ghl?: string, role?: number, api_key?: string, has_outbound?: boolean, token?: string, has_research?: boolean) => {
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
    }

    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("user", JSON.stringify(userData))
    if (token) localStorage.setItem("token", token)
    setIsAuthenticated(true)
    setUser(userData)
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

  const logout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, updateUser, logout }}>
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
