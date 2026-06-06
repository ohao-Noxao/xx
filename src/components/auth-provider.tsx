'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface AuthUser {
  id: string
  name: string
  avatar: string
  phone: string
}

interface AuthContextType {
  user: AuthUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (phone: string, password: string) => Promise<{ error?: string }>
  register: (name: string, phone: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  updateSession: (data: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setStatus('authenticated')
        } else {
          setUser(null)
          setStatus('unauthenticated')
        }
      })
      .catch(() => {
        setUser(null)
        setStatus('unauthenticated')
      })
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || '登录失败' }
      }
      setUser(data)
      setStatus('authenticated')
      return {}
    } catch {
      return { error: '登录失败' }
    }
  }, [])

  const register = useCallback(async (name: string, phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || '注册失败' }
      }
      // Auto-login after registration
      setUser(data)
      setStatus('authenticated')
      return {}
    } catch {
      return { error: '注册失败' }
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const updateSession = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
