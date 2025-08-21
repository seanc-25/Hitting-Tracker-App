'use client'

import { ReactNode } from 'react'

interface ClientProvidersProps {
  children: ReactNode
}

/**
 * Client-side providers wrapper component
 * Add additional client-side providers here as needed
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  // Client-side providers wrapper - no OAuth processing needed
  // OAuth is handled server-side via /auth/callback route
  return (
    <>
      {/* Add additional client-side providers here */}
      {children}
    </>
  )
} 