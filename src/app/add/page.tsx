"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Field from '@/components/Field'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { normalizeBattingSide } from '@/utils/battingSideUtils'
import { getCurrentDateInTimezone } from '@/utils/dateUtils'
import SegmentedControlBar from '@/components/SegmentedControlBar'

interface HitLocation {
  x: number
  y: number
}

interface AtBatForm {
  date: string
  pitchType: string
  timing: string
  pitchZone: number | null
  contact: number
  hitType: string
  hitLocation: HitLocation | null
  battingSide: 'left' | 'right' | ''
}

interface AtBatFormErrors {
  date?: string
  pitchType?: string
  timing?: string
  pitchZone?: string
  contact?: string
  hitType?: string
  hitLocation?: string
  battingSide?: string
}

// Get today's date in America/Los_Angeles timezone for the date input
const getTodayLocalDate = () => {
  return getCurrentDateInTimezone()
}

const initialState: AtBatForm = {
  date: getTodayLocalDate(),
  pitchType: "",
  timing: "",
  pitchZone: null,
  contact: 3,
  hitType: "",
  hitLocation: null,
  battingSide: '',
}

const pitchTypeOptions = ["Fastball", "Offspeed"]
const timingOptions = ["Early", "On Time", "Late"]
// Updated labels to match requested UX: Line Drive, Grounder, Flyball
const hitTypeOptions = ["Line Drive", "Grounder", "Flyball"]

export default function AddAtBatPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [form, setForm] = useState<AtBatForm>({
    ...initialState,
    // Defaults for speed: FB (Fastball) and On Time
    pitchType: "Fastball",
    timing: "On Time",
  })
  const [errors, setErrors] = useState<AtBatFormErrors>({})
  const [userHittingSide, setUserHittingSide] = useState<'left' | 'right' | 'switch' | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Load user profile to check hitting side
  // Note: This would need to be updated to work with Clerk user data
  useEffect(() => {
    // For now, assume all users are right-handed hitters
    // This would need to be updated to work with Clerk user metadata
    setUserHittingSide('right')
    setForm(prev => ({ ...prev, battingSide: 'right' }))
    setIsLoadingProfile(false)
  }, [])

  // Handle field changes
  const handleChange = (field: keyof AtBatForm, value: any) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Handle grid click
  const handleZoneClick = (zone: number) => {
    setForm(f => ({ ...f, pitchZone: zone }))
  }

  // Handle close button
  const handleClose = () => {
    router.push('/')
  }

  // Validation
  const validate = () => {
    const newErrors: AtBatFormErrors = {}
    if (!form.date) newErrors.date = "Date is required"
    if (!form.pitchType) newErrors.pitchType = "Pitch type is required"
    if (!form.timing) newErrors.timing = "Timing is required"
    if (!form.pitchZone) newErrors.pitchZone = "Pitch location is required"
    if (!form.contact) newErrors.contact = "Contact is required"
    if (!form.hitType) newErrors.hitType = "Hit type is required"
    if (!form.hitLocation) newErrors.hitLocation = "Hit location is required"
    
    // Only validate batting side if user is a switch hitter
    if (userHittingSide === 'switch' && !form.battingSide) {
      newErrors.battingSide = "Please select which side you hit from"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit handler with Supabase integration
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    try {
      if (!isSignedIn || !user) {
        throw new Error('User not authenticated')
      }

      // Prepare at-bat data for Supabase
      const atBatData = {
        user_id: user.id,
        date: form.date,
        pitch_type: form.pitchType,
        timing: form.timing,
        pitch_location: form.pitchZone!, // We know this is not null due to validation
        contact: form.contact,
        hit_type: form.hitType,
        hit_location: form.hitLocation ? JSON.stringify(form.hitLocation) : null,
        batting_side: normalizeBattingSide(form.battingSide), // Normalize to 'Left' or 'Right'
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('at_bats')
        .insert([atBatData])
        .select()

      if (error) {
        throw new Error(error.message)
      }

      // Show success message
      alert('At-bat saved successfully!')
      
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error saving at-bat:', error)
      alert(`Error saving at-bat: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 pt-6 pb-16">
      <div className="w-full max-w-2xl relative">
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

        <div className="text-center mb-8 mt-12">
          <h1 className="text-3xl font-bold text-white">Log At-Bat</h1>
          <p className="text-lg text-gray-400 mt-2">Record your performance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
        {/* Date */}
        <div className="bg-gray-900 rounded-lg p-6">
          <label className="block text-lg font-medium text-gray-300 mb-3">Date</label>
          <input 
            type="date" 
            value={form.date} 
            onChange={e => handleChange("date", e.target.value)} 
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" 
          />
          {errors.date && <p className="text-red-400 text-sm mt-2">{errors.date}</p>}
        </div>

        {/* Conditional Batting Side for Switch Hitters */}
        {userHittingSide === 'switch' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <label className="block text-lg font-medium text-gray-300 mb-4">
              Batting side
            </label>
            <div className="flex gap-3">
              {(['left', 'right'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => handleChange("battingSide", side)}
                  className={`flex-1 py-3 px-6 text-center font-medium rounded-full border transition-all duration-200 text-lg ${
                    form.battingSide === side
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                  }`}
                >
                  {side.charAt(0).toUpperCase() + side.slice(1)}
                </button>
              ))}
            </div>
            {errors.battingSide && <p className="text-red-400 text-sm mt-2">{errors.battingSide}</p>}
          </div>
        )}

        {/* Pitch Type (vertical) + Pitch Location (9-box) side-by-side */}
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex w-full justify-center items-start gap-8">
            {/* Left: Pitch Type vertical stack */}
            <div className="flex flex-col">
              <label className="block text-lg font-medium text-gray-300 mb-3 text-center">Pitch Type</label>
              <div className="flex flex-col gap-2">
                {(["Fastball", "Offspeed"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("pitchType", opt)}
                    className={`h-12 px-8 rounded-full text-base font-medium transition-all duration-200 border ${
                      form.pitchType === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    }`}
                    aria-pressed={form.pitchType === opt}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.pitchType && <p className="text-red-400 text-sm mt-2">{errors.pitchType}</p>}
            </div>

            {/* Right: Pitch Location strike zone */}
            <div className="flex flex-col items-center">
              <label className="block text-lg font-medium text-gray-300 mb-3 text-center">Pitch Location</label>
              <div className="grid grid-cols-3 gap-1.5 w-32">
                {[1,2,3,4,5,6,7,8,9].map(zone => (
                  <button 
                    type="button" 
                    key={zone} 
                    onClick={() => handleZoneClick(zone)}
                    className={`h-10 w-10 flex items-center justify-center rounded-md text-base font-medium transition-all duration-200 transform focus:outline-none ${
                      form.pitchZone === zone 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-102 active:scale-95'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
              {errors.pitchZone && <p className="text-red-400 text-sm mt-2 self-start">{errors.pitchZone}</p>}
            </div>
          </div>
        </div>

        {/* Timing - 3-segment control (Early | On Time | Late) */}
        <div className="bg-gray-900 rounded-lg p-6">
          <label className="block text-lg font-medium text-gray-300 mb-3">Timing</label>
          <div className="relative w-full rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
            {/* Sliding indicator */}
            <div
              aria-hidden
              className="absolute top-0 bottom-0 rounded-xl bg-blue-600 transition-[left] duration-200 ease-out"
              style={{ 
                left: `${form.timing === 'Early' ? '0%' : form.timing === 'On Time' ? '33.33%' : '66.67%'}`, 
                width: '33.33%' 
              }}
            />
            
            {/* Buttons */}
            <div className="relative z-10 grid grid-cols-3">
              {(["Early", "On Time", "Late"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChange("timing", opt)}
                  className={`py-3 text-base font-medium transition-colors duration-150 ${
                    form.timing === opt
                      ? 'text-blue-100'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  aria-pressed={form.timing === opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          {errors.timing && <p className="text-red-400 text-sm mt-2">{errors.timing}</p>}
        </div>

        {/* Contact (1-5) - SegmentedControlBar with sliding indicator */}
        <div className="bg-gray-900 rounded-lg p-6">
          <label className="block text-lg font-medium text-gray-300 mb-3">Contact Quality</label>
          <SegmentedControlBar
            ariaLabel="Contact Quality"
            value={form.contact as 1 | 2 | 3 | 4 | 5}
            onChange={(val) => handleChange('contact', val)}
            className="w-full"
          />
          <div className="flex justify-between text-base font-medium text-gray-400 mt-3">
            <span>Weak</span>
            <span>Very Strong</span>
          </div>
          {errors.contact && <p className="text-red-400 text-sm mt-2">{errors.contact}</p>}
        </div>

        {/* Hit Type (vertical) + Hit Location side-by-side */}
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex w-full justify-center items-start gap-8">
            {/* Left: Hit Type vertical stack */}
            <div className="flex flex-col">
              <label className="block text-lg font-medium text-gray-300 mb-3 text-center">Hit Type</label>
              <div className="flex flex-col gap-2">
                {(["Flyball", "Line Drive", "Grounder"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hitType", opt)}
                    className={`h-10 px-5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
                      form.hitType === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    }`}
                    aria-pressed={form.hitType === opt}
                    aria-label={opt}
                    title={opt}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
              {errors.hitType && <p className="text-red-400 text-sm mt-2">{errors.hitType}</p>}
            </div>

            {/* Right: Hit Location field */}
            <div className="flex flex-col items-center">
              <label className="block text-lg font-medium text-gray-300 mb-3 text-center">Hit Location</label>
              <div className="w-40 h-32">
                <Field 
                  onLocationSelect={(x, y) => setForm(f => ({ ...f, hitLocation: { x, y } }))}
                  selectedLocation={form.hitLocation}
                  className="w-full h-full"
                />
              </div>
              {errors.hitLocation && <p className="text-red-400 text-sm mt-2 text-center">{errors.hitLocation}</p>}
            </div>
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex justify-center pt-1">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-lg rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              Save At-Bat
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 