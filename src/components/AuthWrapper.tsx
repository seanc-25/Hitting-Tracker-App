'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import BottomNavWithFAB from './BottomNavWithFAB'

interface AuthWrapperProps {
  children: React.ReactNode
}

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

// Routes that are part of the auth flow but not public
const authFlowRoutes = ['/onboarding']

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, isLoading, isInitialized, refreshSession } = useAuth()
  const [hasHandledRedirect, setHasHandledRedirect] = useState(false)
  const [isCheckingOAuth, setIsCheckingOAuth] = useState(false)

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const isPublicRoute = publicRoutes.includes(pathname)
      const isAuthFlowRoute = authFlowRoutes.includes(pathname)

      // Wait for auth state to be fully initialized
      if (isLoading || !isInitialized) {
        return
      }

      // Check for OAuth session if we're on the home page and no user
      if (pathname === '/' && !user && !isCheckingOAuth) {
        setIsCheckingOAuth(true)
        try {
          console.log('=== CHECKING FOR OAUTH SESSION ===')
          
          // Check if we have OAuth URL parameters
          const urlParams = new URLSearchParams(window.location.search)
          const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('access_token')
          
          if (hasOAuthParams) {
            console.log('OAuth parameters detected in URL, waiting for redirect...')
            // Wait longer for OAuth redirect to complete
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            // Wait a bit for OAuth redirect to complete
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          // Check if we have OAuth tokens in cookies
          const accessToken = document.cookie.split('; ').find(row => row.startsWith('sb-access-token='))
          const refreshToken = document.cookie.split('; ').find(row => row.startsWith('sb-refresh-token='))
          
          if (accessToken || refreshToken) {
            console.log('Found OAuth tokens, attempting to restore session...')
            
            // Try to refresh the session
            const { error } = await refreshSession()
            
            if (!error) {
              console.log('✅ OAuth session restored successfully via refresh')
              // The AuthContext will handle this via onAuthStateChange
              return
            } else {
              console.error('Error restoring OAuth session:', error)
            }
          }
        } catch (error) {
          console.error('Error checking OAuth session:', error)
        } finally {
          setIsCheckingOAuth(false)
        }
      }

      // Case 1: No user - redirect to login
      if (!user) {
        if (!isPublicRoute && !isAuthFlowRoute) {
          router.push('/login')
          setHasHandledRedirect(true)
        } else {
          // User is on a public route and not authenticated - this is fine
          setHasHandledRedirect(false)
        }
        return
      }

      // Case 2: User exists but no profile - redirect to onboarding
      if (user && profile === null) {
        if (pathname !== '/onboarding') {
          router.push('/onboarding')
          setHasHandledRedirect(true)
          return
        }
        // User is on onboarding page and has no profile - this is correct
        setHasHandledRedirect(false)
        return
      }

      // Case 3: User and profile exist - redirect to home if on auth routes
      if (user && profile) {
        if (isPublicRoute || isAuthFlowRoute) {
          router.push('/')
          setHasHandledRedirect(true)
          return
        }
        // User is on a protected route with profile - this is correct
        setHasHandledRedirect(false)
        return
      }

      // Case 4: Edge case - user exists but profile is undefined (shouldn't happen)
      setHasHandledRedirect(false)
    }

    handleAuthRedirect()
  }, [user, profile, pathname, router, isLoading, isInitialized])

  // Show loading spinner if still loading, not initialized, or checking OAuth
  if (isLoading || !isInitialized || isCheckingOAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isCheckingOAuth ? 'Checking authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Determine if we should show the bottom navigation
  // Only show for authenticated users who have completed onboarding on protected routes
  // This ensures the bottom nav is hidden on:
  // - Public routes: /login, /signup, /forgot-password, /reset-password
  // - Auth flow routes: /onboarding
  // - Add AB form page (/add)
  // - Loading/initialization states
  // - Unauthenticated users
  const shouldShowBottomNav = 
    user && 
    profile?.has_completed_onboarding === true && 
    !publicRoutes.includes(pathname) && 
    !authFlowRoutes.includes(pathname) &&
    pathname !== '/add'

  // Render children with conditional bottom navigation
  return (
    <>
      {children}
      {shouldShowBottomNav && <BottomNavWithFAB />}
    </>
  )
} 