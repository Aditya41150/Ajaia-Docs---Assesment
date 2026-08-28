import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  switchDemoUser: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const switchDemoUser = async (email: string) => {
    setLoading(true)
    await supabase.auth.signOut()
    // For the hiring assessment demo mode, we use the known password
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'demo1234',
    })
    
    if (error && error.message.includes('Invalid login credentials')) {
      console.log('User might not exist, attempting to create demo user...')
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'demo1234',
      })
      
      if (signUpError) {
        console.error('Error creating demo user:', signUpError.message)
        alert(`Signup failed: ${signUpError.message}. Please ensure the Email provider is enabled in Supabase Auth -> Providers.`)
      } else if (data.session) {
        // Success
        error = null
      } else {
        alert('Demo users are not created yet. To auto-create them, you must disable "Confirm email" in your Supabase Auth settings. Otherwise, manually create them in Supabase Dashboard with password "demo1234".')
      }
    } else if (error) {
      console.error('Error switching demo user:', error.message)
      alert(`Error logging in: ${error.message}`)
    }
    
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
