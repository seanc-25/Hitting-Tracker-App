'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { normalizeBattingSide, battingSideToDisplay } from '@/utils/battingSideUtils'
import { formatTimestampForDisplay, formatDateForLocaleDisplay } from '@/utils/dateUtils'
import SegmentedControlBar from '@/components/SegmentedControlBar'
import Field from '@/components/Field'

interface AtBat {
  id: string
  user_id: string
  date: string
  pitch_type: string
  timing: string
  pitch_location: number
  contact: number
  hit_type: string
  hit_location: string | null
  batting_side: 'Left' | 'Right' // Now required, not nullable
  created_at: string
}

interface EditingAtBat {
  id: string
  date: string
  pitch_type: string
  timing: string
  pitch_location: number
  contact: number
  hit_type: string
  hit_location: { x: number; y: number } | null
  batting_side: 'Left' | 'Right' // Now required, not nullable
}

export default function DataPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [atBats, setAtBats] = useState<AtBat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<EditingAtBat | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [deletedAtBat, setDeletedAtBat] = useState<{ atBat: AtBat; timestamp: number } | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    pitchType: [] as string[],
    pitchLocation: [] as number[],
    timing: [] as string[],
    contactQuality: [] as number[],
    hitType: [] as string[],
    hitLocation: [] as string[],
    battingSide: [] as string[]
  })

  // Redirect unauthenticated users immediately
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const fetchAtBats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!isSignedIn || !user) {
          throw new Error('User not authenticated')
        }

        // Fetch at-bats for current user
        const { data, error } = await supabase
          .from('at_bats')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) {
          throw new Error(error.message)
        }

        setAtBats(data || [])
      } catch (err) {
        console.error('Error fetching at-bats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load at-bats')
      } finally {
        setIsLoading(false)
      }
    }

    if (isSignedIn && user) {
      fetchAtBats()
    }
  }, [isSignedIn, user])

  const handleClose = () => {
    router.push('/')
  }

  const handleEdit = (atBat: AtBat) => {
    setEditingId(atBat.id)
    setEditingData({
      id: atBat.id,
      date: atBat.date,
      pitch_type: atBat.pitch_type,
      timing: atBat.timing,
      pitch_location: atBat.pitch_location,
      contact: atBat.contact,
      hit_type: atBat.hit_type,
      hit_location: atBat.hit_location ? JSON.parse(atBat.hit_location) : null,
      batting_side: atBat.batting_side,
    })
  }

  const handleSave = async () => {
    if (!editingData) return

    try {
      const { error } = await supabase
        .from('at_bats')
        .update({
          date: editingData.date,
          pitch_type: editingData.pitch_type,
          timing: editingData.timing,
          pitch_location: editingData.pitch_location,
          contact: editingData.contact,
          hit_type: editingData.hit_type,
          hit_location: editingData.hit_location ? JSON.stringify(editingData.hit_location) : null,
          batting_side: normalizeBattingSide(editingData.batting_side),
        })
        .eq('id', editingData.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update local state - convert hit_location back to string format
      setAtBats(prev => prev.map(ab => 
        ab.id === editingData.id 
          ? { 
              ...ab, 
              ...editingData, 
              hit_location: editingData.hit_location ? JSON.stringify(editingData.hit_location) : null 
            }
          : ab
      ))

      setEditingId(null)
      setEditingData(null)
    } catch (err) {
      console.error('Error updating at-bat:', err)
      alert(`Error updating at-bat: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const handleUndo = async () => {
    if (!deletedAtBat) return

    try {
      const { error } = await supabase
        .from('at_bats')
        .insert([deletedAtBat.atBat])

      if (error) {
        throw error
      }

      // Add back to local state
      setAtBats(prev => [deletedAtBat.atBat, ...prev])
      
      // Hide toast and clear deleted at-bat
      setShowUndoToast(false)
      setDeletedAtBat(null)
    } catch (err) {
      console.error('Error undoing delete:', err)
      alert(`Error undoing delete: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Find the at-bat before deleting
      const atBatToDelete = atBats.find(ab => ab.id === id)
      if (!atBatToDelete) return

      const { error } = await supabase
        .from('at_bats')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      // Store deleted at-bat for potential undo
      setDeletedAtBat({ atBat: atBatToDelete, timestamp: Date.now() })
      setShowUndoToast(true)

      // Remove from local state
      setAtBats(prev => prev.filter(ab => ab.id !== id))
      setDeleteConfirmId(null)

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowUndoToast(false)
        setDeletedAtBat(null)
      }, 5000)
    } catch (err) {
      console.error('Error deleting at-bat:', err)
      alert(`Error deleting at-bat: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const formatDate = (dateString: string) => {
    // If it's a simple date string (YYYY-MM-DD), use locale formatting
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return formatDateForLocaleDisplay(dateString)
    }
    
    // If it's a timestamp (has time component), use timezone-aware formatting
    return formatTimestampForDisplay(dateString)
  }

  const getContactStars = (contact: number) => {
    return '★'.repeat(contact)
  }

  const getContactDescription = (contact: number) => {
    switch (contact) {
      case 1: return 'Very Soft'
      case 2: return 'Weak'
      case 3: return 'Decent'
      case 4: return 'Good'
      case 5: return 'Barreled'
      default: return 'Unknown'
    }
  }

  const generateAtBatDescription = (atBat: AtBat) => {
    const contactDesc = getContactDescription(atBat.contact)
    const hitType = atBat.hit_type.toLowerCase()
    const pitchType = atBat.pitch_type.toLowerCase()
    
    return `${contactDesc} ${hitType} on a ${pitchType}.`
  }

  // Filter functions
  const applyFilters = () => {
    let filtered = [...atBats]
    
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(ab => {
        const atBatDate = new Date(ab.date)
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null
        
        if (startDate && endDate) {
          return atBatDate >= startDate && atBatDate <= endDate
        } else if (startDate) {
          return atBatDate >= startDate
        } else if (endDate) {
          return atBatDate <= endDate
        }
        return true
      })
    }
    
    if (filters.pitchType.length > 0) {
      filtered = filtered.filter(ab => filters.pitchType.includes(ab.pitch_type))
    }
    
    if (filters.pitchLocation.length > 0) {
      filtered = filtered.filter(ab => filters.pitchLocation.includes(ab.pitch_location))
    }
    
    if (filters.timing.length > 0) {
      filtered = filtered.filter(ab => filters.timing.includes(ab.timing))
    }
    
    if (filters.contactQuality.length > 0) {
      filtered = filtered.filter(ab => filters.contactQuality.includes(ab.contact))
    }
    
    if (filters.hitType.length > 0) {
      filtered = filtered.filter(ab => filters.hitType.includes(ab.hit_type))
    }
    
    if (filters.hitLocation.length > 0) {
      filtered = filtered.filter(ab => {
        if (!ab.hit_location) return false
        const location = JSON.parse(ab.hit_location)
        const direction = getHitLocationDirection(location.x, location.y)
        return filters.hitLocation.includes(direction)
      })
    }
    
    if (filters.battingSide.length > 0) {
      filtered = filtered.filter(ab => filters.battingSide.includes(ab.batting_side))
    }
    
    return filtered
  }

  const getHitLocationDirection = (x: number, y: number) => {
    if (x < 0.33) return 'Pull'
    if (x > 0.67) return 'Opposite Field'
    return 'Up the Middle'
  }

  const toggleFilter = (category: keyof typeof filters, value: string | number) => {
    setFilters(prev => {
      const currentValues = prev[category] as (string | number)[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return { ...prev, [category]: newValues }
    })
  }

  const clearAllFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      pitchType: [],
      pitchLocation: [],
      timing: [],
      contactQuality: [],
      hitType: [],
      hitLocation: [],
      battingSide: []
    })
  }

  const getFilteredAtBats = () => {
    return applyFilters()
  }

  const StrikeZone = ({ pitchLocation, isEditing, onZoneClick, size = "normal" }: { 
    pitchLocation: number
    isEditing?: boolean
    onZoneClick?: (zone: number) => void
    size?: "normal" | "large" | "small"
  }) => {
    const zones = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ]

    const sizeClasses = size === "large" ? "w-32 h-32" : size === "small" ? "w-16 h-16" : "w-20 h-20"

    return (
      <div className={`${sizeClasses} grid grid-cols-3 grid-rows-3 gap-0.5`}>
        {zones.flat().map((zone) => {
          const isSelected = zone === pitchLocation
          const base = 'w-full h-full border transition-all duration-200'
          const bgWhenIdle = isSelected ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600'
          const hover = isEditing && !isSelected ? 'hover:bg-gray-700' : ''
          const cursor = isEditing ? 'cursor-pointer' : 'cursor-default'

          return (
            <button
              key={zone}
              onClick={() => isEditing && onZoneClick && onZoneClick(zone)}
              disabled={!isEditing}
              className={`${base} ${bgWhenIdle} ${hover} ${cursor}`}
              aria-label={`Zone ${zone}`}
              data-zone={zone}
            />
          )
        })}
      </div>
    )
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your at-bats...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 pt-6 pb-32">
      <div className="w-full max-w-md relative">
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

        {/* Header */}
        <div className="text-center mb-6 mt-12">
          <h1 className="text-3xl font-bold text-white mb-2">Your At-Bats</h1>
          <p className="text-gray-400">Track your performance over time</p>
        </div>

        {/* Horizontal Line */}
        <div className="border-t border-gray-800 mb-4"></div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center pr-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                (Object.values(filters).some(f => {
                  if (Array.isArray(f)) return f.length > 0
                  if (typeof f === 'object' && f !== null) {
                    return Object.values(f).some(val => val !== '')
                  }
                  return f !== ''
                }))
                  ? 'bg-blue-600 text-white' // Active filters applied
                  : showFilters
                    ? 'bg-gray-600 text-white' // Pressed (no active filters)
                    : 'bg-gray-700 text-gray-300' // Default: Light grey
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
              {(Object.values(filters).some(f => {
                if (Array.isArray(f)) return f.length > 0
                if (typeof f === 'object' && f !== null) {
                  return Object.values(f).some(val => val !== '')
                }
                return f !== ''
              })) && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(f => {
                    if (Array.isArray(f)) return f.length > 0
                    if (typeof f === 'object' && f !== null) {
                      return Object.values(f).some(val => val !== '')
                    }
                    return f !== ''
                  }).length}
                </span>
              )}
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-400 text-right">
              Showing {getFilteredAtBats().length} of {atBats.length} AB's
            </span>
          </div>
        </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 bg-gray-900 rounded-lg p-6 border border-gray-800">
              {/* Clear All Button - positioned at top right */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearAllFilters}
                  className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1 rounded-md hover:bg-gray-800"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Date Range</label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                        placeholder="Start date"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {!filters.dateRange.start && (
                        <div className="text-xs text-gray-500 mt-1">Select start date</div>
                      )}
                    </div>
                    <div>
                      <input
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                        placeholder="End date"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {!filters.dateRange.end && (
                        <div className="text-xs text-gray-500 mt-1">Select end date</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batting Side Filter - Only for Switch Hitters */}
                {/* Note: This would need to be updated to work with Clerk user data */}
                {/* {profile?.hitting_side === 'switch' && (
                  <div>
                    <label className="block text-base font-semibold text-gray-300 mb-3">Batting Side</label>
                    <div className="flex justify-center gap-3">
                      {['Left', 'Right'].map(side => (
                        <button
                          key={side}
                          onClick={() => toggleFilter('battingSide', side)}
                          className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${
                            filters.battingSide.includes(side)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                          }`}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* Pitch Type Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Pitch Type</label>
                  <div className="flex justify-center gap-3">
                    {['Fastball', 'Offspeed'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter('pitchType', type)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${
                          filters.pitchType.includes(type)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Location Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Pitch Location</label>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-1 w-32">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(zone => (
                        <button
                          key={zone}
                          onClick={() => toggleFilter('pitchLocation', zone)}
                          className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 transform focus:outline-none ${
                            filters.pitchLocation.includes(zone)
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-102 active:scale-95'
                          }`}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timing Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Timing</label>
                  <div className="flex justify-center gap-3">
                    {['Early', 'On Time', 'Late'].map(timing => (
                      <button
                        key={timing}
                        onClick={() => toggleFilter('timing', timing)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${
                          filters.timing.includes(timing)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {timing}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Quality Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Contact Quality</label>
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map(quality => (
                      <div key={quality} className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => toggleFilter('contactQuality', quality)}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            filters.contactQuality.includes(quality)
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-gray-700 border-gray-400 hover:border-gray-300'
                          }`}
                        />
                        <span className="text-xs text-gray-400 text-center">
                          {getContactDescription(quality)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hit Type Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Hit Type</label>
                  <div className="flex justify-center gap-4">
                    {['Grounder', 'Line Drive', 'Flyball'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter('hitType', type)}
                        className={`py-3 rounded-full text-sm font-medium transition-all duration-200 border ${
                          type === 'Grounder' ? 'w-24' : type === 'Line Drive' ? 'w-28' : 'w-24'
                        } ${
                          filters.hitType.includes(type)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hit Location Filter */}
                <div>
                  <label className="block text-base font-semibold text-gray-300 mb-3">Hit Location</label>
                  <div className="flex justify-center gap-3">
                    {['Left', 'Center', 'Right'].map(location => (
                      <button
                        key={location}
                        onClick={() => toggleFilter('hitLocation', location)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${
                          filters.hitLocation.includes(location)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* At-Bats List */}
        {getFilteredAtBats().length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No at-bats logged yet</h2>
            <p className="text-gray-400">Start tracking your performance by logging your first at-bat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredAtBats().map((atBat) => (
              <div 
                key={atBat.id} 
                className={`bg-gray-900 rounded-xl shadow-md px-6 pt-6 pb-4 border transition-all duration-300 ease-in-out relative ${
                  editingId === atBat.id 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : 'border-gray-800'
                }`}
              >
                {/* Editing Pill Button - Top Center of Border */}
                {editingId === atBat.id && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="text-xs text-white font-semibold bg-blue-500 px-3 py-1 rounded-full border border-blue-500 shadow-lg">
                      Editing
                    </span>
                  </div>
                )}

                {/* Batting Side Indicator for Switch Hitters - Top Center */}
                {/* Note: This would need to be updated to work with Clerk user data */}
                {/* {profile?.hitting_side === 'switch' && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="text-sm text-emerald-400 font-bold bg-gray-900 px-2 py-1 rounded-full border border-emerald-400/30">
                      {atBat.batting_side === 'Left' ? 'L' : 'R'}
                    </span>
                  </div>
                )} */}

                {/* Header with Date and Actions */}
                <div className="flex justify-between items-center mb-0">
                  <h3 className="text-xl font-semibold text-white pl-3 pt-4 underline underline-offset-2">
                    {formatDate(atBat.date)}
                  </h3>

                  <div className="flex items-center gap-2">
                    {editingId !== atBat.id && (
                        <button
                          onClick={() => handleDelete(atBat.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                          aria-label="Delete at-bat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                    )}
                  </div>
                </div>

                {/* Cancel Button - Positioned to align with date */}
                {editingId === atBat.id && (
                  <div className="absolute right-9 top-10">
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-white text-sm font-medium transition-colors focus:outline-none underline underline-offset-2 hover:no-underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Content - Sentence Template with Strike Zone */}
                <div className={`${editingId === atBat.id ? 'block' : 'block'} py-4`}>
                  {/* Sentence Description */}
                  <div className={`${editingId === atBat.id ? 'w-full' : 'w-full'}`}>
                    {editingId === atBat.id ? (
                                              // Edit Mode - Show form fields matching Add AB structure
                        <div className="w-full space-y-4 flex flex-col items-center">
                          {/* Date */}
                        <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                          <label className="block text-base font-medium text-gray-300 mb-2">Date</label>
                          <input
                            type="date"
                            value={editingData?.date || ''}
                            onChange={(e) => setEditingData(prev => prev ? { ...prev, date: e.target.value } : null)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          />
                        </div>
                        
                        {/* Conditional Batting Side for Switch Hitters */}
                        {/* Note: This would need to be updated to work with Clerk user data */}
                        {/* {profile?.hitting_side === 'switch' && (
                          <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                            <label className="block text-base font-medium text-gray-300 mb-2">
                              Which side did you hit from this at-bat?
                            </label>
                            <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                              {(['Right', 'Left'] as const).map((side) => (
                                <button
                                  key={side}
                                  type="button"
                                  onClick={() => setEditingData(prev => prev ? { ...prev, batting_side: normalizeBattingSide(side) } : null)}
                                  className={`flex-1 py-2 px-4 text-center font-medium rounded-md transition-all duration-200 text-base ${
                                    editingData?.batting_side === side
                                      ? 'bg-blue-600 text-white shadow-lg'
                                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                  }`}
                                >
                                  {side}
                                </button>
                              ))}
                            </div>
                          </div>
                        )} */}

                        {/* Pitch Type (vertical) + Pitch Location (9-box) side-by-side */}
                        <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                          <div className="flex w-full justify-center items-start gap-10">
                            {/* Left: Pitch Type vertical stack */}
                            <div className="flex flex-col">
                              <label className="block text-base font-medium text-gray-300 mb-2">Pitch Type</label>
                              <div className="flex flex-col gap-2">
                                {(["Fastball", "Offspeed"] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setEditingData(prev => prev ? { ...prev, pitch_type: opt } : null)}
                                    className={`h-11 px-5 rounded-full text-base font-medium transition-all duration-200 border ${
                                      editingData?.pitch_type === opt
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                                    }`}
                                    aria-pressed={editingData?.pitch_type === opt}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Right: Pitch Location strike zone */}
                            <div className="flex flex-col items-start">
                              <label className="block text-base font-medium text-gray-300 mb-2">Pitch Location</label>
                              <div className="grid grid-cols-3 gap-1 w-28">
                                {[1,2,3,4,5,6,7,8,9].map(zone => (
                                  <button 
                                    type="button" 
                                    key={zone} 
                                    onClick={() => setEditingData(prev => prev ? { ...prev, pitch_location: zone } : null)}
                                    className={`h-9 w-9 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 transform focus:outline-none ${
                                      editingData?.pitch_location === zone 
                                        ? 'bg-blue-600 text-white scale-105' 
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-102 active:scale-95'
                                    }`}
                                  >
                                    {zone}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timing - 3-segment control (Early | On Time | Late) */}
                        <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                          <label className="block text-base font-medium text-gray-300 mb-2">Timing</label>
                          <div className="relative w-full rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
                            {/* Sliding indicator */}
                            <div
                              aria-hidden
                              className="absolute top-0 bottom-0 rounded-xl bg-blue-600 transition-[left] duration-200 ease-out"
                              style={{ 
                                left: editingData?.timing === 'Early' ? '0%' : editingData?.timing === 'On Time' ? '33.33%' : '66.66%', 
                                width: '33.33%' 
                              }}
                            />
                            
                            {/* Buttons */}
                            <div className="relative z-10 grid grid-cols-3">
                              {(["Early", "On Time", "Late"] as const).map((opt) => {
                                const selected = editingData?.timing === opt
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setEditingData(prev => prev ? { ...prev, timing: opt } : null)}
                                    className={`h-12 w-full flex items-center justify-center select-none text-base font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:z-20 ${
                                      selected ? 'text-blue-100' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Contact (1-5) - SegmentedControlBar with sliding indicator */}
                        <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                          <label className="block text-base font-medium text-gray-300 mb-2">Contact Quality</label>
                          <SegmentedControlBar
                            ariaLabel="Contact Quality"
                            value={editingData?.contact as 1 | 2 | 3 | 4 | 5}
                            onChange={(val: 1 | 2 | 3 | 4 | 5) => setEditingData(prev => prev ? { ...prev, contact: val } : null)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm font-medium text-gray-400 mt-2">
                            <span>Weak</span>
                            <span>Very Strong</span>
                          </div>
                        </div>

                        {/* Hit Type (vertical) + Hit Location side-by-side */}
                        <div className="bg-gray-900 rounded-lg p-3 w-full max-w-lg">
                          <div className="flex w-full justify-center items-start gap-10">
                            {/* Left: Hit Type vertical stack */}
                            <div className="flex flex-col">
                              <label className="block text-base font-medium text-gray-300 mb-2">Hit Type</label>
                              <div className="flex flex-col gap-2">
                                {(["Line Drive", "Grounder", "Flyball"] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setEditingData(prev => prev ? { ...prev, hit_type: opt } : null)}
                                    className={`h-9 px-4 rounded-full text-sm font-medium transition-all duration-200 border ${
                                      editingData?.hit_type === opt
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                                    }`}
                                    aria-pressed={editingData?.hit_type === opt}
                                    aria-label={opt}
                                    title={opt}
                                  >
                                    <span>{opt}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Right: Hit Location field */}
                            <div className="flex flex-col items-start">
                              <label className="block text-base font-medium text-gray-300 mb-2">Hit Location</label>
                              <div className="w-40 h-32">
                                <Field 
                                  onLocationSelect={(x, y) => setEditingData(prev => prev ? { ...prev, hit_location: { x, y } } : null)}
                                  selectedLocation={editingData?.hit_location || (atBat.hit_location ? JSON.parse(atBat.hit_location) : null)}
                                  className="w-full h-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save and Cancel Buttons */}
                        <div className="flex justify-center pt-3">
                          <div className="flex gap-4">
                            <button
                              onClick={handleCancelEdit}
                              className="px-8 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-base rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode - Show sentence template
                      <div className="space-y-2 -mt-2">
                        {/* Summary at top */}
                        <div className="flex items-start">
                          <span className="text-lg text-gray-400 font-medium mr-1 flex-shrink-0">Summary:</span>
                          <p className="text-lg text-white font-medium leading-relaxed text-left">
                            {generateAtBatDescription(atBat)}
                          </p>
                        </div>
                        


                                                                        {/* Two-column layout: Strike Zone and Field Outline */}
                                                  <div className="grid grid-cols-2 gap-4 items-center relative mt-2">
                            {/* Left: Strike Zone */}
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-28 h-28 flex justify-center items-center">
                                <StrikeZone 
                                  pitchLocation={atBat.pitch_location}
                                  isEditing={false}
                                  size="normal"
                                />
                              </div>
                            </div>

                          {/* Center Arrow */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>

                          {/* Right: Field Outline */}
                          <div className="flex flex-col items-center">
                            <div className="w-28 h-24 rounded-md p-4 ml-2">
                              {atBat.hit_location ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Field 
                                    onLocationSelect={() => {}} // No-op in view mode
                                    selectedLocation={JSON.parse(atBat.hit_location)}
                                    className="w-full h-full [&_circle]:r-2 [&_div]:scale-150 [&_*]:!visible"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-800 border border-gray-700 rounded-md flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">No data</span>
                          </div>
                        )}
                            </div>
                          </div>
                        </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Arrow - positioned at bottom center */}
                {editingId !== atBat.id && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleCardExpansion(atBat.id)}
                      className="text-gray-400 hover:text-gray-300 transition-all duration-300 ease-in-out transform flex items-center gap-1"
                      aria-label={expandedCards.has(atBat.id) ? 'Show less' : 'Show more'}
                    >
                      <span className="text-xs">
                        {expandedCards.has(atBat.id) ? 'Less info' : 'More info'}
                      </span>
                      <svg 
                        className={`w-3 h-3 transition-transform duration-300 ease-in-out ${
                          expandedCards.has(atBat.id) ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Expanded Details Section */}
                {expandedCards.has(atBat.id) && editingId !== atBat.id && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    {/* Edit Button - positioned above the cards on the left */}
                    <div className="flex justify-start mb-6">
                      <button
                        onClick={() => handleEdit(atBat)}
                        className="w-8 h-8 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                        aria-label="Edit at-bat"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left Column */}
                      <div className="flex-1 space-y-4">
                        {/* Pitch Type */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Pitch Type</h4>
                          <p className="text-white">{atBat.pitch_type}</p>
                        </div>

                        {/* Timing */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Timing</h4>
                          <p className="text-white">{atBat.timing}</p>
                        </div>

                        {/* Hit Type */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Hit Type</h4>
                          <p className="text-white">{atBat.hit_type}</p>
                        </div>

                        {/* Contact Quality */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Contact Quality</h4>
                          <p className="text-white">{getContactDescription(atBat.contact)}</p>
                        </div>
                  </div>

                      {/* Right Column */}
                      <div className="flex-1 space-y-4 flex flex-col justify-between">

                                                {/* Pitch Location */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Pitch Location</h4>
                          <div className="w-full flex justify-center">
                            <div className="w-24 h-24 mt-2">
                    <StrikeZone 
                                pitchLocation={atBat.pitch_location}
                                isEditing={false}
                                size="normal"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Hit Location */}
                        {atBat.hit_location && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Hit Location</h4>
                            <div className="w-full flex justify-center">
                              <div className="w-36 h-32">
                                <Field 
                                  onLocationSelect={() => {}} // No-op in view mode
                                  selectedLocation={JSON.parse(atBat.hit_location)}
                                  className="w-full h-full"
                    />
                  </div>
                </div>
                          </div>
                        )}

                        {/* Batting Side - Only show for switch hitters */}
                        {/* Note: This would need to be updated to work with Clerk user data */}
                        {/* {profile?.hitting_side === 'switch' && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Batting Side</h4>
                            <p className="text-white">{atBat.batting_side}</p>
                          </div>
                        )} */}

                      </div>
                    </div>
                  </div>
                )}


              </div>
            ))}
          </div>
        )}

        {/* Undo Toast */}
        {showUndoToast && deletedAtBat && (
          <div className="fixed bottom-20 left-4 right-4 z-[9999] md:left-1/2 md:right-auto md:w-auto md:transform md:-translate-x-1/2">
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 shadow-lg mx-auto max-w-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white text-sm">At-bat deleted.</span>
                <button
                  onClick={handleUndo}
                  className="text-blue-400 hover:text-blue-300 underline text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Undo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 