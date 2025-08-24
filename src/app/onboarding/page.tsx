'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useDateInput } from '@/hooks/useDateInput'
import { ToggleGroup } from '@/components/ToggleGroup'
import { formatDateForStorage } from '@/utils/dateUtils'

type HittingSide = 'left' | 'right' | 'switch'

const HITTING_SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'switch', label: 'Switch' }
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  
  const birthdayInput = useDateInput()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    hitting_side: null as HittingSide | null
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleHittingSideChange = (value: HittingSide) => {
    setFormData(prev => ({ ...prev, hitting_side: value }))
  }

  const validateForm = () => {
    if (!formData.first_name.trim()) return 'First name is required'
    if (!formData.last_name.trim()) return 'Last name is required'
    if (!birthdayInput.isValid) return 'Please enter a valid birth date (age must be between 4-100 years)'
    if (!formData.hitting_side) return 'Hitting side preference is required'
    return null
  }

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true)
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!formData.hitting_side) {
      setError('Hitting side preference is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Format the date for storage without timezone conversion
      if (!birthdayInput.parsedDate) {
        throw new Error('Invalid birth date')
      }
      const birthday = formatDateForStorage(birthdayInput.parsedDate)

      const { error: onboardingError } = await completeOnboarding({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birthday,
        hitting_side: formData.hitting_side
      })

      if (onboardingError) {
        throw onboardingError
      }

      // AuthWrapper will handle redirect to home
    } catch (err) {
      console.error('Error completing onboarding:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8">Welcome to Baseball Stats</h1>
        
        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="form-field">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your first name"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your last name"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-300 mb-2">
                Birthday
              </label>
              <div className="relative">
                <input
                  id="birthday"
                  name="birthday"
                  type="text"
                  value={birthdayInput.value}
                  onChange={birthdayInput.handleChange}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    hasAttemptedSubmit && birthdayInput.value && !birthdayInput.isValid
                      ? 'border-red-500'
                      : 'border-gray-700'
                  }`}
                  placeholder="MM/DD/YYYY"
                  disabled={isLoading}
                  maxLength={10}
                />
                {hasAttemptedSubmit && birthdayInput.value && !birthdayInput.isValid && (
                  <p className="mt-1 text-xs text-red-400">
                    Please enter a valid date (age must be between 4-100 years)
                  </p>
                )}
              </div>
            </div>

            <div className="form-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hitting Side
              </label>
              <div className="w-full">
                <ToggleGroup
                  options={HITTING_SIDE_OPTIONS}
                  value={formData.hitting_side || ''}
                  onChange={handleHittingSideChange}
                  name="hitting_side"
                  disabled={isLoading}
                  aria-label="Select your hitting side preference"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.first_name || !formData.last_name || !birthdayInput.value || !formData.hitting_side}
            className="w-full p-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:bg-blue-500"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 