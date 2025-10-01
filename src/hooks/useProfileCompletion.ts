import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { getSupabaseClient } from '@/lib/supabase'

interface ProfileCompletion {
  isLoading: boolean
  isCompleted: boolean
  hasProfile: boolean
  profile: any | null
  error: string | null
  isSignedIn: boolean | undefined
}

export function useProfileCompletion(): ProfileCompletion {
  const { user, isSignedIn, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkProfileCompletion = async () => {
      console.log('useProfileCompletion: checking profile for user:', user?.id, 'isSignedIn:', isSignedIn, 'isLoaded:', isLoaded)
      
      // CRITICAL: Wait for Clerk to fully load before making any decisions
      if (!isLoaded) {
        console.log('useProfileCompletion: Clerk not loaded yet, keeping loading true')
        return
      }
      
      // Now that Clerk is loaded, check auth state
      if (!isSignedIn || !user) {
        console.log('useProfileCompletion: user not signed in after Clerk loaded, setting loading false')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Use Supabase client with RLS temporarily disabled
        const supabaseClient = getSupabaseClient()
        
        console.log('useProfileCompletion: fetching profile from database')
        const { data, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('useProfileCompletion: profile query result:', { data, error: profileError })

        if (profileError) {
          console.error('Profile query error:', profileError)
          // If it's an RLS error, we'll treat it as no profile for now
          if (profileError.code === '42501' || profileError.message?.includes('RLS')) {
            console.log('useProfileCompletion: RLS error, treating as no profile')
            setProfile(null)
          } else if (profileError.code === 'PGRST116') {
            // No rows found - this is expected for new users
            console.log('useProfileCompletion: no profile found (new user)')
            setProfile(null)
          } else {
            console.error('Error checking profile:', profileError)
            setError('Failed to check profile status')
            setProfile(null)
          }
        } else {
          setProfile(data)
          console.log('useProfileCompletion: profile set to:', data)
        }
        
      } catch (err) {
        console.error('Error checking profile completion:', err)
        setError('Failed to check profile status')
        setProfile(null)
      } finally {
        setIsLoading(false)
        console.log('useProfileCompletion: loading set to false')
      }
    }

    checkProfileCompletion()
  }, [user, isSignedIn, isLoaded])

  const hasProfile = !!profile
  const isCompleted = hasProfile && profile?.has_completed_onboarding === true

  console.log('useProfileCompletion: final values - hasProfile:', hasProfile, 'isCompleted:', isCompleted, 'profile:', profile)

  return {
    isLoading,
    isCompleted,
    hasProfile,
    profile,
    error,
    isSignedIn
  }
}
