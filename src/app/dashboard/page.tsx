"use client"

import { useState, useEffect } from "react"
import { useUser, SignedIn, SignedOut, SignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Database } from "@/types/database"
import { useProfileCompletion } from "@/hooks/useProfileCompletion"
import Field from "@/components/Field"

type AtBat = Database['public']['Tables']['at_bats']['Row']

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const { isCompleted, isLoading: profileLoading } = useProfileCompletion()
  const [atBats, setAtBats] = useState<AtBat[]>([])
  const [selectedPitchType, setSelectedPitchType] = useState<'all' | 'fastball' | 'offspeed'>('all')
  const [selectedBattingSide, setSelectedBattingSide] = useState<'left' | 'right'>('left')
  const [lastAtBatsCount, setLastAtBatsCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [userHittingSide, setUserHittingSide] = useState<'left' | 'right' | 'switch' | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Redirect if user hasn't completed onboarding
  useEffect(() => {
    if (!profileLoading && !isCompleted) {
      router.push('/onboarding')
    }
  }, [isCompleted, profileLoading, router])

  useEffect(() => {
    if (user) {
      fetchAtBats()
      loadUserProfile()
    }
  }, [user])

  // Load user profile to check hitting side
  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const supabaseClient = getSupabaseClient()
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('hitting_side')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setUserHittingSide('right')
        setSelectedBattingSide('right')
      } else {
        setUserHittingSide(profile.hitting_side)
        // Set default batting side based on user's hitting side
        if (profile.hitting_side !== 'switch') {
          setSelectedBattingSide(profile.hitting_side)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setUserHittingSide('right')
      setSelectedBattingSide('right')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchAtBats = async () => {
    if (!user) return
    
    try {
      const supabaseClient = getSupabaseClient()
      const { data, error } = await supabaseClient
        .from('at_bats')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setAtBats(data || [])
    } catch (error) {
      console.error('Error fetching at-bats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAtBats = () => {
    let filtered = atBats
    
    // Filter by pitch type
    if (selectedPitchType !== 'all') {
      filtered = filtered.filter(ab => 
        ab.pitch_type.toLowerCase() === selectedPitchType
      )
    }
    
    // Filter by batting side for switch hitters
    if (userHittingSide === 'switch') {
      filtered = filtered.filter(ab => 
        ab.batting_side.toLowerCase() === selectedBattingSide
      )
    }
    
    return filtered
  }

  const getRecentAtBats = (count: number) => {
    return getFilteredAtBats().slice(0, Math.min(count, 25))
  }

  const getAverageContact = (atBats: AtBat[]) => {
    if (atBats.length === 0) return 0
    const total = atBats.reduce((sum, ab) => sum + ab.contact, 0)
    return Math.round((total / atBats.length) * 10) / 10
  }

  const getContactDescription = (avg: number) => {
    if (avg === 0) return "No Data"
    if (avg >= 4.5) return "Barreled"
    if (avg >= 4) return "Good"
    if (avg >= 3) return "Decent"
    if (avg >= 2) return "Weak"
    return "Very Soft"
  }

  const getHotColdZones = (atBats: AtBat[]) => {
    const zones = Array(9).fill(0).map(() => ({ total: 0, count: 0 }))
    
    atBats.forEach(ab => {
      const zoneIndex = ab.pitch_location - 1
      if (zoneIndex >= 0 && zoneIndex < 9) {
        zones[zoneIndex].total += ab.contact
        zones[zoneIndex].count += 1
      }
    })

    return zones.map(zone => {
      if (zone.count === 0) return 'no-data'
      const avg = zone.total / zone.count
      if (avg >= 4) return 'hot'
      if (avg >= 2.5) return 'neutral'
      return 'cold'
    })
  }

  const getSprayChartData = (atBats: AtBat[]) => {
    return atBats
      .filter(ab => ab.hit_location)
      .map(ab => {
        try {
          const location = JSON.parse(ab.hit_location!)
          return {
            x: location.x,
            y: location.y,
            contact: ab.contact
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }

  const getTimingBreakdown = (atBats: AtBat[]) => {
    const timing = { early: 0, onTime: 0, late: 0 }
    atBats.forEach(ab => {
      if (ab.timing === 'Early') timing.early++
      else if (ab.timing === 'On Time') timing.onTime++
      else if (ab.timing === 'Late') timing.late++
    })
    return timing
  }

  const getHitTypeBreakdown = (atBats: AtBat[]) => {
    const types = { grounder: 0, lineDrive: 0, flyball: 0 }
    atBats.forEach(ab => {
      if (ab.hit_type === 'Grounder') types.grounder++
      else if (ab.hit_type === 'Line Drive') types.lineDrive++
      else if (ab.hit_type === 'Flyball') types.flyball++
    })
    return types
  }

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'hot': return 'bg-green-500'
      case 'cold': return 'bg-red-500'
      case 'neutral': return 'bg-yellow-500'
      default: return 'bg-gray-600'
    }
  }

  const getContactColor = (contact: number) => {
    if (contact >= 4.5) return 'bg-blue-600'
    if (contact >= 4) return 'bg-green-500'
    if (contact >= 3) return 'bg-yellow-500'
    if (contact >= 2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Show loading while checking profile completion
  if (profileLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user hasn't completed onboarding (will redirect)
  if (!isCompleted) {
    return null
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    )
  }

  const filteredAtBats = getFilteredAtBats()
  const recentAtBats = getRecentAtBats(lastAtBatsCount)
  const avgContact = getAverageContact(recentAtBats)
  const hotColdZones = getHotColdZones(recentAtBats)
  const sprayData = getSprayChartData(recentAtBats)
  const timingData = getTimingBreakdown(recentAtBats)
  const hitTypeData = getHitTypeBreakdown(recentAtBats)

  return (
    <div>
      <SignedIn>
        <div className="min-h-screen bg-black text-white p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 mt-12">
          <h1 className="text-3xl font-bold text-white mb-6">
            Performance Overview
          </h1>
          
          {/* Divider */}
          <div className="w-24 h-0.5 bg-gray-700 mb-6"></div>
          
          {/* Toggle Controls */}
          <div className="flex flex-col sm:flex-row gap-2 items-start">
            {/* Pitch Type Toggle */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-0.5 inline-block border border-gray-700/50">
              <div className="flex">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'fastball', label: 'Fastballs' },
                  { key: 'offspeed', label: 'Offspeed' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedPitchType(option.key as any)}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 ${
                      selectedPitchType === option.key
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Batting Side Toggle - Only for Switch Hitters */}
            {userHittingSide === 'switch' && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-0.5 inline-block border border-gray-700/50">
                <div className="flex">
                  {[
                    { key: 'left', label: 'Left Side' },
                    { key: 'right', label: 'Right Side' }
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSelectedBattingSide(option.key as any)}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 ${
                        selectedBattingSide === option.key
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Avg Contact Chart */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Avg Contact</h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="8"
                    strokeDasharray={`${(avgContact / 5) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">{avgContact}</div>
                    <div className="text-sm text-gray-400">/5</div>
                  </div>
                </div>
              </div>
              <div className="text-lg font-medium text-white mb-2">
                {getContactDescription(avgContact)}
              </div>
               <div className="flex items-center justify-center gap-2 mb-3">
                 <span className="text-sm text-gray-400">Last</span>
                 <div className="relative">
                   <select
                     value={lastAtBatsCount}
                     onChange={(e) => setLastAtBatsCount(Number(e.target.value))}
                     className="appearance-none bg-gray-900/80 backdrop-blur-sm text-white text-sm font-semibold px-2 py-1.5 pr-7 w-14 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 cursor-pointer hover:bg-gray-800/80"
                   >
                     {[5, 10, 15, 20, 25].map(num => (
                       <option key={num} value={num} className="bg-gray-900 text-white">{num}</option>
                     ))}
                   </select>
                   <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                     <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </div>
                 </div>
                 <span className="text-sm text-gray-400">at-bats</span>
               </div>
            </div>
          </div>

          {/* Hot/Cold Zone Map */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Heat Map</h3>
            <div className="grid grid-cols-3 gap-1 w-48 h-48 mx-auto">
              {hotColdZones.map((zone, index) => (
                <div
                  key={index}
                  className={`${getZoneColor(zone)} rounded transition-all duration-200 ${
                    zone === 'hot' ? 'shadow-lg shadow-green-500/25' : 
                    zone === 'cold' ? 'shadow-lg shadow-red-500/25' : ''
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-400">Hot</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-400">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-400">Cold</span>
              </div>
            </div>
          </div>

          {/* Spray Chart */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Spray Chart</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-40 h-32">
                <Field
                  onLocationSelect={() => {}} // No-op since this is read-only
                  className="w-full h-full"
                  selectedLocation={null}
                />
                
                {/* Hit locations overlay */}
                {sprayData.map((hit, index) => (
                  <div
                    key={index}
                    className={`absolute w-1.5 h-1.5 rounded-full ${getContactColor(hit!.contact)} shadow-lg`}
                    style={{
                      left: `${hit!.x * 100}%`,
                      top: `${hit!.y * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </div>
              
              {/* Color Key */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[120px]">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-400">Very Soft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-400">Weak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-400">Decent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-400">Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-400">Barreled</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-2 text-sm text-gray-400">
              {sprayData.length} hits tracked
            </div>
          </div>
        </div>

        {/* No Data State */}
        {filteredAtBats.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {(() => {
                let message = 'No at-bats recorded yet'
                if (selectedPitchType !== 'all') {
                  message = `No ${selectedPitchType} at-bats recorded`
                }
                if (userHittingSide === 'switch' && selectedPitchType !== 'all') {
                  message = `No ${selectedPitchType} at-bats from ${selectedBattingSide} side`
                } else if (userHittingSide === 'switch') {
                  message = `No at-bats from ${selectedBattingSide} side`
                }
                return message
              })()}
            </div>
            <p className="text-gray-500">
              Start logging your at-bats to see your performance data here!
            </p>
          </div>
        )}
      </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Please sign in to access the dashboard</p>
            <SignIn />
          </div>
        </div>
      </SignedOut>
    </div>
  )
}
