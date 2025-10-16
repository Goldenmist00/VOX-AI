"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'citizen' | 'ngo' | 'policymaker'
  organization?: string
  position?: string
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'citizen' | 'ngo' | 'policymaker'
    organization?: string
    position?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isNGO: boolean
  isPolicymaker: boolean
  canAccessDashboard: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (retryCount = 0) => {
    try {
      console.log('AuthContext: Checking authentication... (attempt', retryCount + 1, ')')
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      console.log('AuthContext: Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('AuthContext: User authenticated:', data.user.email)
        setUser(data.user)
      } else if (response.status === 404 && retryCount < 2) {
        // Retry on 404 errors (route might not be ready)
        console.log('AuthContext: 404 error, retrying in 1 second...')
        setTimeout(() => checkAuth(retryCount + 1), 1000)
        return
      } else {
        console.log('AuthContext: User not authenticated')
        setUser(null)
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error)
      if (retryCount < 2) {
        console.log('AuthContext: Network error, retrying in 1 second...')
        setTimeout(() => checkAuth(retryCount + 1), 1000)
        return
      }
      setUser(null)
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login for:', email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('AuthContext: Login response status:', response.status)

      if (response.ok) {
        console.log('AuthContext: Login successful, setting user:', data.user.email)
        setUser(data.user)
        return { success: true }
      } else {
        console.log('AuthContext: Login failed:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('AuthContext: Login network error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const signup = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'citizen' | 'ngo' | 'policymaker'
    organization?: string
    position?: string
  }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/')
    }
  }

  const isAuthenticated = !!user
  const isNGO = user?.role === 'ngo'
  const isPolicymaker = user?.role === 'policymaker'
  const canAccessDashboard = isNGO || isPolicymaker

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated,
        isNGO,
        isPolicymaker,
        canAccessDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
