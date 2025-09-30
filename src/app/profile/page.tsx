'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { getSupabaseClient } from '@/lib/supabase'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'

type HittingSide = 'left' | 'right' | 'switch'

interface UserProfile {
  first_name: string
  last_name: string
  hitting_side: HittingSide
  created_at: string
}

interface UserStats {
  totalAtBats: number
  memberSince: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useUser()
  const { isCompleted, isLoading: profileCompletionLoading } = useProfileCompletion()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isEditingHittingSide, setIsEditingHittingSide] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if user hasn't completed onboarding
  useEffect(() => {
    if (!profileCompletionLoading && !isCompleted) {
      router.push('/onboarding')
    }
  }, [isCompleted, profileCompletionLoading, router])

  // Load user profile and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

             try {
               setIsLoading(true)
               
               // Use regular Supabase client (RLS temporarily disabled)
               const supabaseClient = getSupabaseClient()
               
               // Load profile data
               const { data: profileData, error: profileError } = await supabaseClient
                 .from('profiles')
                 .select('first_name, last_name, hitting_side, created_at')
                 .eq('user_id', user.id)
                 .single()

        if (profileError) {
          console.error('Error loading profile:', profileError)
          setError('Failed to load profile data')
          return
        }

        setProfile(profileData)

               // Load stats data
               const { data: atBatsData, error: atBatsError } = await supabaseClient
                 .from('at_bats')
                 .select('id')
                 .eq('user_id', user.id)

        if (atBatsError) {
          console.error('Error loading stats:', atBatsError)
          setError('Failed to load stats data')
          return
        }

        const memberSince = new Date(profileData.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })

        setStats({
          totalAtBats: atBatsData?.length || 0,
          memberSince
        })

      } catch (error) {
        console.error('Error loading user data:', error)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user])

         const handleUpdateHittingSide = async (newHittingSide: HittingSide) => {
           if (!user || !profile) return

           try {
             setIsLoading(true)
             setError(null)

             // Use regular Supabase client (RLS temporarily disabled)
             const supabaseClient = getSupabaseClient()

             const { error: updateError } = await supabaseClient
               .from('profiles')
               .update({ hitting_side: newHittingSide })
               .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating hitting side:', updateError)
        setError('Failed to update hitting side')
        return
      }

      setProfile(prev => prev ? { ...prev, hitting_side: newHittingSide } : null)
      setIsEditingHittingSide(false)

    } catch (error) {
      console.error('Error updating hitting side:', error)
      setError('Failed to update hitting side')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    router.push('/')
  }

  // Show loading while checking profile completion
  if (profileCompletionLoading) {
    return (
      <div>
        <SignedIn>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </SignedIn>
        
        <SignedOut>
          <SignIn />
        </SignedOut>
      </div>
    )
  }

  // Don't render if user hasn't completed onboarding (will redirect)
  if (!isCompleted) {
    return null
  }

  // Show loading state
  if (isLoading && !profile) {
    return (
      <div>
        <SignedIn>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading profile...</p>
            </div>
          </div>
        </SignedIn>
        
        <SignedOut>
          <SignIn />
        </SignedOut>
      </div>
    )
  }

  return (
    <div>
      <SignedIn>
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
            <p className="text-gray-400">Manage your baseball settings</p>
            <div className="mt-4">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-12 h-12"
                  }
                }}
              />
            </div>
          </div>

          <div className="px-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Baseball Settings */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Baseball Settings</h2>
                
                {/* Hitting Side */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Primary Hitting Side</h3>
                      <p className="text-lg text-white">
                        {profile?.hitting_side ? profile.hitting_side.charAt(0).toUpperCase() + profile.hitting_side.slice(1) : 'Loading...'}
                      </p>
                    </div>
                    {!isEditingHittingSide && (
                      <button
                        onClick={() => setIsEditingHittingSide(true)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingHittingSide && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Select your primary hitting side:</p>
                      <div className="space-y-2">
                        {(['left', 'right', 'switch'] as const).map((side) => (
                          <button
                            key={side}
                            onClick={() => handleUpdateHittingSide(side)}
                            disabled={isLoading}
                            className={`w-full py-2 px-4 text-center font-medium rounded-md border transition-all duration-200 ${
                              profile?.hitting_side === side
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                            } disabled:opacity-50`}
                          >
                            {side.charAt(0).toUpperCase() + side.slice(1)}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setIsEditingHittingSide(false)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-white">Your Stats</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{stats?.totalAtBats || 0}</div>
                    <div className="text-sm text-gray-400 font-medium">Total At-Bats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">
                      {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Loading...'}
                    </div>
                    <div className="text-sm text-gray-400 font-medium">Member Since</div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Account Info</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Name</h3>
                    <p className="text-lg text-white">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Email</h3>
                    <p className="text-lg text-white">{user?.emailAddresses[0]?.emailAddress || 'Not available'}</p>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to sign out?')) {
                      window.location.href = '/sign-in'
                    }
                  }}
                  className="w-full py-3 px-4 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        <SignIn />
      </SignedOut>
    </div>
  )
} 