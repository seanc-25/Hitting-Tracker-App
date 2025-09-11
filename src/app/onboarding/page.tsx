"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const completeOnboarding = async () => {
    try {
      setIsLoading(true)
      
      // For now, just redirect to dashboard
      // In a real app, you'd store onboarding status in your database
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Baseball Stats Tracker!</h1>
          <p className="text-gray-400 text-lg">Let's get you set up to start tracking your at-bats</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">What you can track:</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Pitch type and location
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Contact quality and timing
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Hit type and location
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Performance analytics
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Mobile Optimized</h2>
            <p className="text-gray-300 mb-4">
              This app is designed for mobile use. You can add it to your home screen for easy access.
            </p>
            <div className="text-sm text-gray-400">
              <p>• Use in portrait mode for best experience</p>
              <p>• Tap the + button to add new at-bats</p>
              <p>• Use bottom navigation to switch between pages</p>
            </div>
          </div>

          <button
            onClick={completeOnboarding}
            disabled={isLoading}
            className="w-full p-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up...
              </div>
            ) : (
              'Get Started'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
