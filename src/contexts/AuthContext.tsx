'use client'

import { createContext, useContext, ReactNode } from 'react'

// Note: This file is being phased out in favor of Clerk authentication
// Keeping minimal structure for compatibility during transition

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
  user: any | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any | null }>
  refreshSession: () => Promise<{ error: Error | null }>
  recoverOAuthSession: () => Promise<{ error: Error | null }>
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
  refreshSession: async () => ({ error: null }),
  recoverOAuthSession: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  completeOnboarding: async () => ({ error: null }),
})

// Note: This AuthContext is being phased out in favor of Clerk authentication
// The provider below returns empty/default values for compatibility

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthState = {
    user: null,
    profile: null,
    isLoading: false,
    isInitialized: true,
    signInWithEmail: async () => ({ error: null }),
    signUpWithEmail: async () => ({ error: null }),
    refreshSession: async () => ({ error: null }),
    recoverOAuthSession: async () => ({ error: null }),
    signOut: async () => {},
    updateProfile: async () => ({ error: null }),
    completeOnboarding: async () => ({ error: null }),
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