'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { formatDateForLocaleDisplay } from '@/utils/dateUtils'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect unauthenticated users immediately
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Starting sign out process...')
      await signOut()
      
      // Sign out successful - redirect to sign-in page
      console.log('Sign out completed successfully')
      router.push('/sign-in')
    } catch (err) {
      console.error('Error during sign out:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign out')
      setIsLoading(false)
    }
  }

  // Show loading while Clerk is checking auth status
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting unauthenticated users
  if (!isSignedIn || !user) {
    return null
  }

  const handleClose = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="p-4">
        <div className="w-full max-w-md relative mx-auto">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 mt-12">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      <div className="px-4">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm text-gray-400 mb-1">Name</h2>
            <p className="text-lg">{user?.firstName} {user?.lastName}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm text-gray-400 mb-1">Email</h2>
            <p className="text-lg">{user?.emailAddresses[0]?.emailAddress || 'Not available'}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm text-gray-400 mb-1">User ID</h2>
            <p className="text-lg font-mono text-sm">{user?.id}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-sm text-gray-400 mb-1">Account Created</h2>
            <p className="text-lg">
              {user?.createdAt ? formatDateForLocaleDisplay(user.createdAt.toISOString().split('T')[0]) : 'Not available'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full p-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-red-500 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing out...
              </div>
            ) : (
              'Sign Out'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 