'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('🔍 [DEPLOYMENT DEBUG] App Error:', error)
    console.error('🔍 [DEPLOYMENT DEBUG] Error stack:', error.stack)
    console.error('🔍 [DEPLOYMENT DEBUG] Error environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong!</h1>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}
