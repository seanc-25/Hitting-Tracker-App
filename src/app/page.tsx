"use client"

import { SignedIn, SignedOut } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useProfileCompletion } from "@/hooks/useProfileCompletion"

export default function Home() {
  const router = useRouter()
  const { isSignedIn, isLoading, isCompleted } = useProfileCompletion()

  console.log('Home page: isSignedIn:', isSignedIn, 'isLoading:', isLoading, 'isCompleted:', isCompleted)

  useEffect(() => {
    console.log('Home page useEffect: isLoading:', isLoading, 'isSignedIn:', isSignedIn, 'isCompleted:', isCompleted)
    
    // CRITICAL: Only redirect when we have definitive auth state
    // Must wait for BOTH: isLoading === false AND isSignedIn !== undefined
    if (!isLoading && isSignedIn !== undefined) {
      if (isSignedIn) {
        // User is signed in, redirect based on completion status
        if (isCompleted) {
          console.log('Home page: redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.log('Home page: redirecting to onboarding')
          router.push('/onboarding')
        }
      } else {
        // User is definitively not signed in, redirect to sign-in
        console.log('Home page: redirecting to sign-in')
        router.push('/sign-in')
      }
    } else {
      console.log('Home page: waiting for auth state - isLoading:', isLoading, 'isSignedIn:', isSignedIn)
    }
  }, [isSignedIn, isLoading, isCompleted, router])

  // Show loading while auth state is being determined
  if (isLoading || isSignedIn === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">
            {isLoading ? 'Checking authentication...' : 'Initializing...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SignedIn>
        {/* Show loading while redirecting signed-in users */}
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        {/* Show loading while redirecting to sign-in */}
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Redirecting to sign-in...</p>
          </div>
        </div>
      </SignedOut>
    </div>
  )
}
