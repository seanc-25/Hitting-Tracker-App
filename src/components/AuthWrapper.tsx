'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const { user, profile, isLoading, isInitialized } = useAuth()
  const [hasHandledRedirect, setHasHandledRedirect] = useState(false)

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const isPublicRoute = publicRoutes.includes(pathname)
      const isAuthFlowRoute = authFlowRoutes.includes(pathname)

      console.log('=== AUTH WRAPPER REDIRECT LOGIC ===')
      console.log('Current pathname:', pathname)
      console.log('User exists:', !!user)
      console.log('Profile exists:', !!profile)
      console.log('Is loading:', isLoading)
      console.log('Is initialized:', isInitialized)
      console.log('Is public route:', isPublicRoute)
      console.log('Is auth flow route:', isAuthFlowRoute)

      // Wait for auth state to be fully initialized
      if (isLoading || !isInitialized) {
        console.log('Auth state not ready - loading:', isLoading, 'initialized:', isInitialized)
        return
      }

      // Case 1: No user - redirect to login
      if (!user) {
        if (!isPublicRoute && !isAuthFlowRoute) {
          console.log('No user, redirecting to login')
          router.push('/login')
          setHasHandledRedirect(true)
        } else {
          // User is on a public route and not authenticated - this is fine
          console.log('User is on public route without auth - allowing access')
          setHasHandledRedirect(false)
        }
        return
      }

      // Case 2: User exists but no profile - redirect to onboarding
      if (user && profile === null) {
        if (pathname !== '/onboarding') {
          console.log('User authenticated but no profile found, redirecting to onboarding')
          router.push('/onboarding')
          setHasHandledRedirect(true)
          return
        }
        // User is on onboarding page and has no profile - this is correct
        console.log('User on onboarding page with no profile, allowing access')
        setHasHandledRedirect(false)
        return
      }

      // Case 3: User and profile exist - redirect to home if on auth routes
      if (user && profile) {
        if (isPublicRoute || isAuthFlowRoute) {
          console.log('Authenticated user with profile on auth route, redirecting to home')
          router.push('/')
          setHasHandledRedirect(true)
          return
        }
        // User is on a protected route with profile - this is correct
        console.log('User with profile on protected route, allowing access')
        setHasHandledRedirect(false)
        return
      }

      // Case 4: Edge case - user exists but profile is undefined (shouldn't happen)
      console.log('Edge case: user exists but profile is undefined')
      setHasHandledRedirect(false)
    }

    handleAuthRedirect()
  }, [user, profile, pathname, router, isLoading, isInitialized])

  // Show loading spinner if still loading or not initialized
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Determine if we should show the bottom navigation
  // Only show for authenticated users who have completed onboarding on protected routes
  const shouldShowBottomNav = 
    user && 
    profile?.has_completed_onboarding === true && 
    !publicRoutes.includes(pathname) && 
    !authFlowRoutes.includes(pathname) &&
    pathname !== '/add'

  return (
    <>
      {children}
      {shouldShowBottomNav && <BottomNavWithFAB />}
    </>
  )
} 