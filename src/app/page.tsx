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
    
    // Only redirect when we have a definitive answer about sign-in status
    if (!isLoading && isSignedIn !== undefined) {
      // Add a small delay to ensure Clerk is fully initialized
      const timeoutId = setTimeout(() => {
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
          // User is not signed in, redirect to sign-in
          console.log('Home page: redirecting to sign-in')
          router.push('/sign-in')
        }
      }, 100); // 100ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [isSignedIn, isLoading, isCompleted, router])

  return (
    <div>
      <SignedIn>
        {/* Show loading while redirecting */}
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
