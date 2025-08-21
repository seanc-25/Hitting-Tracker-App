import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Bypass all middleware logic during development to prevent false redirects
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // 🔒 In production, you would validate Supabase session here

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 