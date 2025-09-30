'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import BottomNavWithFAB from './BottomNavWithFAB'

export default function ConditionalBottomNav() {
  const { isSignedIn } = useUser()
  const pathname = usePathname()

  // Don't show navbar if user is not signed in
  if (!isSignedIn) {
    return null
  }

  // Only show navbar on specific authenticated pages
  const allowedPaths = ['/', '/dashboard', '/data', '/videos', '/profile']
  
  // Check if current path is in allowed list
  const isAllowedPath = allowedPaths.includes(pathname)
  
  if (!isAllowedPath) {
    return null
  }

  // Show navbar only for allowed authenticated pages
  return <BottomNavWithFAB />
}
