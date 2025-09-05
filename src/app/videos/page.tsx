'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function VideosPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/')
  }

  return (
    <AuthGuard>
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
        <h1 className="text-3xl font-bold text-white mb-2">Videos</h1>
        <p className="text-gray-400">Swing analysis and training content</p>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center px-4 mt-16">
        <div className="text-center max-w-md">
          {/* Large Video Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="2" />
              <path d="M10 10l5 3-5 3v-6z" fill="currentColor" />
            </svg>
          </div>

          {/* Coming Soon Message */}
          <h2 className="text-2xl font-bold text-white mb-4">Coming Soon!</h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            We're working hard to bring you exciting video features and training content.
          </p>

          {/* Call to Action */}
          <p className="text-sm text-gray-500">
            Keep tracking your at-bats and stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
