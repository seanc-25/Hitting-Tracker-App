"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useProfileCompletion } from "@/hooks/useProfileCompletion"

type HittingSide = 'left' | 'right' | 'switch'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const { isCompleted, isLoading: profileLoading } = useProfileCompletion()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHittingSide, setSelectedHittingSide] = useState<HittingSide | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (!profileLoading && isCompleted) {
      router.push('/dashboard')
    }
  }, [isCompleted, profileLoading, router])

  const completeOnboarding = async () => {
    // Validate required fields
    if (!firstName.trim()) {
      setError("Please enter your first name")
      return
    }

    if (!lastName.trim()) {
      setError("Please enter your last name")
      return
    }

    if (!selectedHittingSide) {
      setError("Please select which side you hit from")
      return
    }

    if (!user) {
      setError("User not found. Please try signing in again.")
      return
    }

           try {
             setIsLoading(true)
             setError(null)
             
             // Use regular Supabase client (RLS temporarily disabled)
             const supabaseClient = getSupabaseClient()
             
             // Create user profile with hitting side and onboarding completion
             const { error: profileError } = await supabaseClient
               .from('profiles')
               .insert({
                 user_id: user.id,
                 email: user.emailAddresses[0]?.emailAddress || null,
                 first_name: firstName.trim(),
                 last_name: lastName.trim(),
                 birthday: new Date().toISOString().split('T')[0], // Default to today, can be updated later
                 hitting_side: selectedHittingSide,
                 has_completed_onboarding: true
               })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        
        // Handle specific error cases
        if (profileError.code === '23505') {
          // Unique constraint violation - profile already exists
          setError("Profile already exists. Redirecting to dashboard...")
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        } else if (profileError.code === '42501') {
          // RLS policy violation
          setError("Permission denied. Please try again.")
        } else {
          setError(`Failed to create profile: ${profileError.message}`)
        }
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking profile completion
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user has completed onboarding (will redirect)
  if (isCompleted) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Baseball Stats Tracker!</h1>
          <p className="text-gray-400 text-lg">Track every at-bat to improve your hitting</p>
        </div>
        
        {/* Core Features */}
        <div className="space-y-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Log At-Bats</h3>
              <p className="text-gray-400 text-sm">Tap the + button to record each at-bat</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">See Your Progress</h3>
              <p className="text-gray-400 text-sm">Dashboard shows your performance trends</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analyze Your Data</h3>
              <p className="text-gray-400 text-sm">Heat maps and spray charts reveal your patterns</p>
            </div>
          </div>
        </div>

        {/* Name Input */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">What's your name?</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {error && (!firstName.trim() || !lastName.trim()) && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Hitting Side Selection */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Which side do you primarily hit from?</h2>
          <div className="space-y-3">
            {(['left', 'right', 'switch'] as const).map((side) => (
              <button
                key={side}
                onClick={() => setSelectedHittingSide(side)}
                className={`w-full py-4 px-6 text-center font-medium rounded-lg border transition-all duration-200 ${
                  selectedHittingSide === side
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </div>
          {error && selectedHittingSide === null && firstName.trim() && lastName.trim() && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Mobile Tip */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-blue-300 text-sm">
              Add to home screen for quick access during practice
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && selectedHittingSide && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Get Started Button */}
        <button
          onClick={completeOnboarding}
          disabled={isLoading}
          className="w-full p-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Setting up...
            </div>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  )
}
