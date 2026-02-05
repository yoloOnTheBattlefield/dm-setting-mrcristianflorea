import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id?: string
  ghl?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role?: number
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: (email: string, firstName?: string, lastName?: string, id?: string, ghl?: string, role?: number) => void
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

    if (authStatus === "true" && userDataString) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userDataString))
    }
    setLoading(false)
  }, [])

  const login = (email: string, firstName?: string, lastName?: string, id?: string, ghl?: string, role?: number) => {
    const fullName = firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || email.split('@')[0]

    const userData: User = {
      id,
      ghl,
      email,
      firstName,
      lastName,
      name: fullName,
      role
    }

    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("user", JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
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
