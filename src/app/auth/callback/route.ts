import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')

  console.log('=== ENHANCED OAUTH CALLBACK START ===')
  console.log('Code received:', code ? 'yes' : 'no')
  console.log('State received:', state ? 'yes' : 'no')
  console.log('Full URL:', request.url)

  if (code) {
    try {
      console.log('Processing OAuth callback with code')
      
      // Exchange the authorization code for a session
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }

      if (!session) {
        console.error('No session returned after code exchange')
        throw new Error('No session returned from Supabase')
      }

      console.log('✅ Successfully exchanged code for session')
      console.log('User ID:', session.user?.id)
      console.log('User email:', session.user?.email)
      console.log('Session expires:', session.expires_at ? new Date(session.expires_at * 1000) : 'no expiry')
      console.log('Access token length:', session.access_token?.length || 0)
      console.log('Refresh token length:', session.refresh_token?.length || 0)
      
      // Create response with redirect to home
      const response = NextResponse.redirect(new URL('/', requestUrl.origin))
      
      // Enhanced session cookies for better persistence
      if (session.access_token) {
        response.cookies.set('sb-access-token', session.access_token, {
          httpOnly: false, // Allow client-side access for debugging
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })
        console.log('✅ Set access token cookie')
      } else {
        console.log('⚠️ No access token to set in cookie')
      }
      
      if (session.refresh_token) {
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: false, // Allow client-side access for debugging
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        })
        console.log('✅ Set refresh token cookie')
      } else {
        console.log('⚠️ No refresh token to set in cookie')
      }

      // Set additional auth cookie for Supabase compatibility
      if (session.access_token && session.refresh_token) {
        const authToken = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          token_type: 'bearer',
          user: {
            id: session.user?.id,
            email: session.user?.email,
            role: 'authenticated'
          }
        })
        
        response.cookies.set('sb-auth-token', authToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })
        console.log('✅ Set auth token cookie')
      }

      // Add cache control headers to prevent caching of the callback
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')

      console.log('OAuth login successful, redirecting to home with enhanced session cookies')
      console.log('=== OAUTH CALLBACK COMPLETE ===')
      
      return response
    } catch (error) {
      console.error('=== OAUTH CALLBACK ERROR ===')
      console.error('Auth error:', error)
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      // Redirect to login with specific error
      const errorParam = error instanceof Error ? error.message : 'unknown_error'
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, requestUrl.origin))
    }
  }

  // No code provided
  console.error('=== OAUTH CALLBACK ERROR ===')
  console.error('No code provided in OAuth callback')
  console.error('Search params:', Object.fromEntries(requestUrl.searchParams.entries()))
  console.error('Full URL:', request.url)
  
  return NextResponse.redirect(new URL('/login?error=no_authorization_code', requestUrl.origin))
} 