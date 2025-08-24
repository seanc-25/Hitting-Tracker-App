import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')

  console.log('=== OAUTH CALLBACK START ===')
  console.log('Code received:', code ? 'yes' : 'no')
  console.log('State received:', state ? 'yes' : 'no')

  if (code) {
    try {
      console.log('Processing OAuth callback with code')
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        throw error
      }

      if (!session) {
        console.error('No session returned after code exchange')
        throw new Error('No session returned')
      }

      console.log('✅ Successfully exchanged code for session')
      console.log('User ID:', session.user?.id)
      console.log('Session expires:', session.expires_at ? new Date(session.expires_at * 1000) : 'no expiry')
      
      // Set cookies for session persistence
      const response = NextResponse.redirect(new URL('/', requestUrl.origin))
      
      // Add session cookies for better persistence
      if (session.access_token) {
        response.cookies.set('sb-access-token', session.access_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      }
      
      if (session.refresh_token) {
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }

      console.log('OAuth login successful, redirecting to home with session cookies')
      return response
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin))
    }
  }

  // No code provided
  console.error('No code provided in OAuth callback')
  return NextResponse.redirect(new URL('/auth?error=no_code', requestUrl.origin))
} 