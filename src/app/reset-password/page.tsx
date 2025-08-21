'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if the user is in PASSWORD_RECOVERY state
    const checkPasswordRecoveryState = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsValidSession(false)
          return
        }

        // If there's a session, we assume it's from a password recovery flow
        // since this page should only be accessible via password recovery
        if (session?.user) {
          console.log('User session found for password recovery')
          setIsValidSession(true)
        } else {
          // No session at all
          console.log('No session found')
          setIsValidSession(false)
        }
      } catch (err) {
        console.error('Error checking password recovery state:', err)
        setIsValidSession(false)
      }
    }

    checkPasswordRecoveryState()
  }, [router])

  useEffect(() => {
    if (isSuccess) {
      const doLogout = async () => {
        try {
          await supabase.auth.signOut()
        } catch (err) {
          console.error('Error signing out after password reset:', err)
        } finally {
          setTimeout(() => router.push('/login'), 1000)
        }
      }
      doLogout()
    }
  }, [isSuccess, router])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    return null
  }

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
    setError(null)
    setPasswords(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { password, confirmPassword } = passwords

    // Validate all fields are filled
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Ensure passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        // Handle specific Supabase errors
        console.error('Password update error:', updateError)
        
        if (updateError.message.includes('session_not_found')) {
          setError('Your reset session has expired. Please request a new password reset link.')
        } else if (updateError.message.includes('weak_password')) {
          setError('Password is too weak. Please choose a stronger password.')
        } else if (updateError.message.includes('same_password')) {
          setError('New password must be different from your current password.')
        } else {
          setError(updateError.message || 'Failed to update password')
        }
        return
      }

      // Success - show success message and trigger UI update
      setIsSuccess(true)
      return // stop execution here

    } catch (err) {
      console.error('Unexpected error updating password:', err)
      
      // Show styled error message
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      
      // Ensure loading stops
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid session - show error
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h1>
            <p className="text-gray-400 mb-8">
              This password reset link is either invalid or has expired.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/forgot-password"
              className="block w-full p-4 bg-blue-500 text-white text-center rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
            >
              Request New Reset Link
            </Link>
            
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

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h1>
            <p className="text-gray-400 mb-8">
              Your password has been updated successfully. For security, you will be signed out and redirected to the login page.
            </p>
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Signing out and redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="mt-2 text-gray-400">Enter your new password below</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={passwords.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Enter new password"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwords.password || !passwords.confirmPassword}
            className="w-full flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-blue-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        <p className="text-center text-gray-400">
          <Link href="/login" className="text-blue-500 hover:text-blue-400">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
} 