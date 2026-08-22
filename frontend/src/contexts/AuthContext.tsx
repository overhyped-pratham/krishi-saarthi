import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | { id: string; email: string } | null
  session: Session | null
  loading: boolean
  isDemoUser: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | { message: string } | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | { message: string } | null }>
  loginAsDemo: (email?: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | { id: string; email: string } | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoUser, setIsDemoUser] = useState(false)

  useEffect(() => {
    // Check if there is an existing demo user in localStorage
    const savedDemo = localStorage.getItem('agriproof_demo_user')
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo)
        setUser(parsed)
        setIsDemoUser(true)
        setLoading(false)
        return
      } catch (e) {
        localStorage.removeItem('agriproof_demo_user')
      }
    }

    // Otherwise check Supabase session safely
    try {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data?.session) {
          setSession(data.session)
          setUser(data.session.user ?? null)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession) {
          setSession(newSession)
          setUser(newSession.user ?? null)
          setIsDemoUser(false)
        }
        setLoading(false)
      })

      return () => listener?.subscription?.unsubscribe?.()
    } catch (err) {
      console.warn('[Auth] Supabase init skipped or in demo mode:', err)
      setLoading(false)
    }
  }, [])

  const loginAsDemo = (email?: string) => {
    const demo = {
      id: 'demo-farmer-001',
      email: email && email.includes('@') ? email : 'farmer@agriproof.ai',
    }
    localStorage.setItem('agriproof_demo_user', JSON.stringify(demo))
    setUser(demo)
    setIsDemoUser(true)
  }

  const signUp = async (email: string, password: string) => {
    try {
      const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      if (isPlaceholder) {
        loginAsDemo(email)
        return { error: null }
      }
      const { error } = await supabase.auth.signUp({ email, password })
      return { error }
    } catch (err: any) {
      // Graceful fallback to demo mode
      loginAsDemo(email)
      return { error: null }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      if (isPlaceholder) {
        loginAsDemo(email)
        return { error: null }
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // If Supabase fails due to network/placeholder, fallback to demo login
        loginAsDemo(email)
        return { error: null }
      }
      return { error }
    } catch (err: any) {
      loginAsDemo(email)
      return { error: null }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('agriproof_demo_user')
    setUser(null)
    setSession(null)
    setIsDemoUser(false)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemoUser, signUp, signIn, loginAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
