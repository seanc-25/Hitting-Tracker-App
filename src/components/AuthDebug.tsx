'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function AuthDebug() {
  const { user, profile, isLoading, isInitialized, refreshSession } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkSession = async () => {
    try {
      console.log('=== DEBUG SESSION CHECK ===')
      
      // Check localStorage
      const storedSession = localStorage.getItem('supabase.auth.token')
      console.log('LocalStorage session:', storedSession ? 'exists' : 'not found')
      
      // Check cookies
      const cookies = document.cookie.split('; ').map(row => row.split('='))
      const authCookies = cookies.filter(([key]) => key.startsWith('sb-'))
      console.log('Auth cookies:', authCookies)
      
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Current session:', session ? 'exists' : 'null')
      console.log('Session error:', error)
      
      if (session) {
        console.log('Session user:', session.user?.id)
        console.log('Session expires:', session.expires_at ? new Date(session.expires_at * 1000) : 'no expiry')
      }
      
      // Check user state
      console.log('Auth context user:', user?.id || 'null')
      console.log('Auth context profile:', profile?.id || 'null')
      console.log('Loading:', isLoading)
      console.log('Initialized:', isInitialized)
      
      setDebugInfo({
        localStorage: storedSession ? 'exists' : 'not found',
        cookies: authCookies,
        session: session ? 'exists' : 'null',
        sessionError: error,
        sessionUser: session?.user?.id || 'null',
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : 'no expiry',
        contextUser: user?.id || 'null',
        contextProfile: profile?.id || 'null',
        loading: isLoading,
        initialized: isInitialized
      })
    } catch (error) {
      console.error('Debug check failed:', error)
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Unknown error occurred'
      setDebugInfo({ error: errorMessage })
    }
  }

  const forceRefresh = async () => {
    try {
      console.log('=== FORCE SESSION REFRESH ===')
      const { error } = await refreshSession()
      if (error) {
        console.error('Force refresh failed:', error)
      } else {
        console.log('Force refresh successful')
        await checkSession()
      }
    } catch (error) {
      console.error('Force refresh error:', error)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md text-xs text-gray-300 z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Auth Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={checkSession}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Check
          </button>
          <button
            onClick={forceRefresh}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="space-y-1">
          <div><strong>LocalStorage:</strong> {debugInfo.localStorage}</div>
          <div><strong>Cookies:</strong> {debugInfo.cookies?.length || 0}</div>
          <div><strong>Session:</strong> {debugInfo.session}</div>
          <div><strong>Session User:</strong> {debugInfo.sessionUser}</div>
          <div><strong>Context User:</strong> {debugInfo.contextUser}</div>
          <div><strong>Context Profile:</strong> {debugInfo.contextProfile}</div>
          <div><strong>Loading:</strong> {debugInfo.loading ? 'true' : 'false'}</div>
          <div><strong>Initialized:</strong> {debugInfo.initialized ? 'true' : 'false'}</div>
          {debugInfo.sessionError && (
            <div><strong>Session Error:</strong> {debugInfo.sessionError.message}</div>
          )}
        </div>
      )}
    </div>
  )
}
