'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) {
        throw resetError
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('Error sending reset email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Check Your Email</h1>
            <p className="text-gray-400 mb-8">
              We've sent a password reset link to <span className="text-white">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setIsSubmitted(false)
                setEmail('')
                setError(null)
              }}
              className="w-full p-4 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
            >
              Try Again
            </button>
            
            <Link
              href="/login"
              className="block w-full p-4 text-center text-blue-500 hover:text-blue-400 font-medium focus:outline-none focus:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="pt-6 pb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-400">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 