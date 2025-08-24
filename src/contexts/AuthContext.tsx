'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Types
export interface UserProfile {
  id: string
  user_id: string
  email: string | null
  first_name: string
  last_name: string
  birthday: string // ISO date string
  hitting_side: 'left' | 'right' | 'switch'
  created_at: string
  updated_at: string
  has_completed_onboarding: boolean
}

export interface OnboardingData {
  first_name: string
  last_name: string
  birthday: string // ISO date string
  hitting_side: 'left' | 'right' | 'switch'
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>
  completeOnboarding: (data: OnboardingData) => Promise<{ error: Error | null }>
}

// Create context with a default value
const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  refreshSession: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  completeOnboarding: async () => ({ error: null }),
})

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch profile for a user (don't create if it doesn't exist)
  const fetchProfile = async (user: User) => {
    try {
      console.log('Fetching profile for user:', user.id)
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )
      
      const { data: existingProfile, error: fetchError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any

      console.log('Profile fetch completed. Data:', existingProfile ? 'found' : 'null', 'Error:', fetchError)

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Error fetching profile: ${fetchError.message}`)
      }

      if (existingProfile) {
        console.log('Found existing profile:', existingProfile.id)
        setProfile(existingProfile)
        return existingProfile
      }

      // If no profile exists, explicitly set profile to null
      // This ensures the AuthWrapper knows the user needs to complete onboarding
      console.log('No profile found for user:', user.id, '- user needs to complete onboarding')
      setProfile(null)
      return null
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      // On error, also set profile to null to prevent blocking
      setProfile(null)
      return null
    }
  }

  // Debug utility to check session state
  const debugSessionState = () => {
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('supabase.auth.token')
      console.log('=== SESSION DEBUG ===')
      console.log('LocalStorage session:', storedSession ? 'exists' : 'not found')
      console.log('Current user state:', user?.id || 'null')
      console.log('Current profile state:', profile?.id || 'null')
      console.log('Loading state:', isLoading)
      console.log('Initialized state:', isInitialized)
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession)
          console.log('Session expiry:', new Date(parsed.expires_at * 1000))
          console.log('Session valid:', Date.now() < parsed.expires_at * 1000)
        } catch (e) {
          console.log('Could not parse stored session')
        }
      }
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('=== AUTH INITIALIZATION START ===')
        
        // Debug: Check if session data exists in storage
        if (typeof window !== 'undefined') {
          const storedSession = localStorage.getItem('supabase.auth.token')
          console.log('Stored session data:', storedSession ? 'exists' : 'not found')
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession)
              console.log('Session expiry:', new Date(parsed.expires_at * 1000))
              console.log('Session valid:', Date.now() < parsed.expires_at * 1000)
            } catch (e) {
              console.log('Could not parse stored session')
            }
          }
        }
        
        // Wait longer for Supabase to restore session from storage and handle OAuth redirects
        console.log('Waiting for session restoration and OAuth processing...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Get initial session with retry logic
        console.log('Calling getSession()...')
        let session = null
        let error = null
        
        // Try multiple times to get the session
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await supabase.auth.getSession()
            session = result.data.session
            error = result.error
            
            if (session?.user || error) {
              console.log(`Session retrieval attempt ${attempt} completed`)
              break
            }
            
            console.log(`Session retrieval attempt ${attempt} returned no session, retrying...`)
            await new Promise(resolve => setTimeout(resolve, 200 * attempt))
          } catch (retryError) {
            console.error(`Session retrieval attempt ${attempt} failed:`, retryError)
            if (attempt === 3) {
              error = retryError as any
              break
            }
            await new Promise(resolve => setTimeout(resolve, 200 * attempt))
          }
        }
        
        if (error) {
          console.error('Error getting initial session after retries:', error)
          if (mounted) {
            setIsLoading(false)
            setIsInitialized(true)
          }
          return
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for user:', session.user.id)
          console.log('Session access token expires:', session.expires_at ? new Date(session.expires_at * 1000) : 'no expiry')
          setUser(session.user)
          
          // Fetch profile with timeout protection
          try {
            const profileResult = await fetchProfile(session.user)
            console.log('Profile fetch result:', profileResult ? 'found' : 'null')
          } catch (error) {
            console.error('Profile fetch failed, continuing with null profile:', error)
            setProfile(null)
          }
          
          // Always mark initialization as complete after profile fetch attempt
          if (mounted) {
            setIsLoading(false)
            setIsInitialized(true)
          }
        } else {
          console.log('❌ No initial session found after retries')
          // Mark initialization as complete even when no session exists
          if (mounted) {
            setIsLoading(false)
            setIsInitialized(true)
          }
        }
        
        console.log('=== AUTH INITIALIZATION COMPLETE ===')
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Ensure initialization completes even on error
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===')
        console.log('Event:', event)
        console.log('Session user:', session?.user?.id)
        console.log('Session expires:', session?.expires_at ? new Date(session.expires_at * 1000) : 'no session')
        console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'server-side')
        
        if (!mounted) return

        // Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery detected, redirecting to reset-password')
          router.push('/reset-password')
          return
        }
        
        // Handle OAuth sign-in events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log(`🔄 ${event} event detected`)
          
          if (session?.user) {
            console.log('✅ OAuth session established for user:', session.user.id)
            setUser(session.user)
            
            // Fetch profile with timeout protection
            try {
              const profileResult = await fetchProfile(session.user)
              console.log('Profile fetch result:', profileResult ? 'found' : 'null')
            } catch (error) {
              console.error('Profile fetch failed, continuing with null profile:', error)
              setProfile(null)
            }
            
            // Always mark as initialized after profile fetch attempt
            if (!isInitialized) {
              setIsInitialized(true)
              setIsLoading(false)
            }
          } else {
            console.error('❌ OAuth event but no session user found')
          }
          return
        }
        
        if (session?.user) {
          console.log('✅ Session restored/updated for user:', session.user.id)
          setUser(session.user)
          
          // Fetch profile with timeout protection
          try {
            const profileResult = await fetchProfile(session.user)
            console.log('Profile fetch result:', profileResult ? 'found' : 'null')
          } catch (error) {
            console.error('Profile fetch failed, continuing with null profile:', error)
            setProfile(null)
          }
          
          // Always mark as initialized after profile fetch attempt
          if (!isInitialized) {
            setIsInitialized(true)
            setIsLoading(false)
          }
        } else {
          console.log('❌ No session found, clearing user state')
          setUser(null)
          setProfile(null)
          
          // Mark as initialized when clearing user state
          if (!isInitialized) {
            setIsInitialized(true)
            setIsLoading(false)
          }
        }
      }
    )

    // Start initialization
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove isInitialized dependency to prevent infinite loop

  // Auth methods
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Error signing in with email:', error)
      return { error: error as AuthError }
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Error signing up with email:', error)
      return { error: error as AuthError }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('=== GOOGLE SIGN IN START ===')
      debugSessionState()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      
      if (error) {
        console.error('Google OAuth error:', error)
        return { error }
      } else {
        console.log('Google OAuth initiated successfully')
        return { error: null }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { error: error as AuthError }
    }
  }

  // Manual session refresh utility
  const refreshSession = async () => {
    try {
      console.log('=== MANUAL SESSION REFRESH ===')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return { error }
      }
      
      if (session?.user) {
        console.log('✅ Session refreshed successfully for user:', session.user.id)
        setUser(session.user)
        
        // Fetch profile
        try {
          const profileResult = await fetchProfile(session.user)
          console.log('Profile fetch result after refresh:', profileResult ? 'found' : 'null')
        } catch (error) {
          console.error('Profile fetch failed after refresh:', error)
          setProfile(null)
        }
        
        return { error: null }
      } else {
        console.log('❌ No session returned after refresh')
        return { error: new Error('No session returned') }
      }
    } catch (error) {
      console.error('Error in refreshSession:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      console.log('Sign out completed successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      // Re-throw the error so the Profile page can handle it
      throw error
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      console.log('Updating profile for user:', user.id, data)
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...data } : null)
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: error as Error }
    }
  }

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      console.log('Completing onboarding for user:', user.id)
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error checking profile: ${fetchError.message}`)
      }

      const profileData = {
        ...data,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString()
      }

      let error
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile for user:', user.id)
        const result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id)
        error = result.error
      } else {
        // Create new profile
        console.log('Creating new profile for user:', user.id)
        const result = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            email: user.email,
            ...profileData,
            created_at: new Date().toISOString()
          }])
        error = result.error
      }

      if (error) {
        throw error
      }

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        ...profileData
      } : {
        id: '', // Will be set when we refetch
        user_id: user.id,
        email: user.email || null,
        created_at: new Date().toISOString(),
        ...profileData
      } as UserProfile)

      // Refetch the profile to get the complete data with correct ID
      await fetchProfile(user)

      return { error: null }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      return { error: error as Error }
    }
  }

  const value: AuthState = {
    user,
    profile,
    isLoading,
    isInitialized,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    refreshSession,
    signOut,
    updateProfile,
    completeOnboarding,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 