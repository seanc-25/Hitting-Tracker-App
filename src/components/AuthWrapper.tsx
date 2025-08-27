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

      // Enhanced OAuth session recovery logic
      if (pathname === '/' && !user && !isCheckingOAuth) {
        setIsCheckingOAuth(true)
        try {
          console.log('=== ENHANCED OAUTH SESSION RECOVERY ===')
          
          // Check if we have OAuth URL parameters
          const urlParams = new URLSearchParams(window.location.search)
          const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('access_token')
          
          if (hasOAuthParams) {
            console.log('OAuth parameters detected in URL, waiting for redirect...')
            // Wait longer for OAuth redirect to complete
            await new Promise(resolve => setTimeout(resolve, 4000)) // Increased from 3000ms
          } else {
            // Wait a bit for OAuth redirect to complete
            await new Promise(resolve => setTimeout(resolve, 2000)) // Increased from 1500ms
          }
          
          // Enhanced cookie checking for OAuth tokens
          const cookies = document.cookie.split('; ')
          const accessToken = cookies.find(row => row.startsWith('sb-access-token='))
          const refreshToken = cookies.find(row => row.startsWith('sb-refresh-token='))
          const authToken = cookies.find(row => row.startsWith('sb-auth-token='))
          
          console.log('OAuth cookies found:', {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            authToken: !!authToken
          })
          
          if (accessToken || refreshToken || authToken) {
            console.log('Found OAuth tokens, attempting to restore session...')
            
            // Try multiple approaches to restore the session
            let sessionRestored = false
            
            // Approach 1: Try to refresh the session
            try {
              const { error } = await refreshSession()
              if (!error) {
                console.log('✅ OAuth session restored successfully via refresh')
                sessionRestored = true
              } else {
                console.log('Session refresh failed, trying direct session check...')
              }
            } catch (error) {
              console.log('Session refresh threw error, trying direct session check...')
            }
            
            // Approach 2: If refresh failed, try direct session check
            if (!sessionRestored) {
              try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (session?.user) {
                  console.log('✅ OAuth session found via direct check for user:', session.user.id)
                  sessionRestored = true
                } else {
                  console.log('Direct session check failed:', error)
                }
              } catch (error) {
                console.log('Direct session check threw error:', error)
              }
            }
            
            // Approach 3: If still no session, try to process OAuth hash
            if (!sessionRestored && typeof window !== 'undefined' && window.location.hash) {
              try {
                console.log('Attempting to process OAuth hash...')
                // Wait a bit more for Supabase to process the hash
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                const { data: { session }, error } = await supabase.auth.getSession()
                if (session?.user) {
                  console.log('✅ OAuth session restored via hash processing for user:', session.user.id)
                  sessionRestored = true
                } else {
                  console.log('Hash processing failed:', error)
                }
              } catch (error) {
                console.log('Hash processing threw error:', error)
              }
            }
            
            // Approach 4: If still no session, try manual token restoration
            if (!sessionRestored && accessToken && refreshToken) {
              try {
                console.log('Attempting manual token restoration...')
                
                // Wait a bit more for Supabase to process the tokens
                await new Promise(resolve => setTimeout(resolve, 1500))
                
                // Try to refresh the session again
                const { error } = await supabase.auth.refreshSession()
                if (!error) {
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session?.user) {
                    console.log('✅ OAuth session restored via manual token restoration for user:', session.user.id)
                    sessionRestored = true
                  }
                }
              } catch (error) {
                console.log('Manual token restoration failed:', error)
              }
            }
            
            if (!sessionRestored) {
              console.log('❌ All OAuth session recovery attempts failed')
            }
          } else {
            console.log('No OAuth tokens found in cookies')
          }
          
          // Final check: see if we now have a user
          if (!user) {
            console.log('Still no user after OAuth recovery attempts')
          }
          
        } catch (error) {
          console.error('Error in enhanced OAuth session recovery:', error)
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