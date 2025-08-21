import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

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

      console.log('Successfully exchanged code for session, user:', session.user?.id)

      // Successful login - redirect to home
      // AuthWrapper will handle redirecting to onboarding if no profile exists
      console.log('OAuth login successful, redirecting to home')
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin))
    }
  }

  // No code provided
  console.error('No code provided in OAuth callback')
  return NextResponse.redirect(new URL('/auth?error=no_code', requestUrl.origin))
} 