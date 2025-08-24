"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database"
import Field from "@/components/Field"

type AtBat = Database['public']['Tables']['at_bats']['Row']

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth()
  const [atBats, setAtBats] = useState<AtBat[]>([])
  const [selectedPitchType, setSelectedPitchType] = useState<'all' | 'fastball' | 'offspeed'>('all')
  const [selectedBattingSide, setSelectedBattingSide] = useState<'left' | 'right'>('left')
  const [lastAtBatsCount, setLastAtBatsCount] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAtBats()
    }
  }, [user])

  const fetchAtBats = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
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
    if (profile?.hitting_side === 'switch') {
      filtered = filtered.filter(ab => 
        ab.batting_side?.toLowerCase() === selectedBattingSide
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile?.has_completed_onboarding) {
    return null
  }

  const filteredAtBats = getFilteredAtBats()
  const recentAtBats = getRecentAtBats(lastAtBatsCount)
  const avgContact = getAverageContact(recentAtBats)
  const hotColdZones = getHotColdZones(recentAtBats)
  const sprayData = getSprayChartData(recentAtBats)
  const timingData = getTimingBreakdown(recentAtBats)
  const hitTypeData = getHitTypeBreakdown(recentAtBats)

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 mt-12">
          <h1 className="text-3xl font-bold text-white mb-6">
            Performance Overview
          </h1>
          
          {/* Divider */}
          <div className="w-24 h-0.5 bg-gray-700 mb-6"></div>
          
          {/* Pitch Type Toggle */}
          <div className="bg-gray-900 rounded-xl p-1 inline-block">
            <div className="flex">
              {[
                { key: 'all', label: 'All Pitches' },
                { key: 'fastball', label: 'Fastballs' },
                { key: 'offspeed', label: 'Offspeed' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSelectedPitchType(option.key as any)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedPitchType === option.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Batting Side Selector for Switch Hitters */}
          {profile?.hitting_side === 'switch' && (
            <div className="mt-4">
              <div className="bg-gray-900 rounded-xl p-1 inline-block">
                <div className="flex">
                  {[
                    { key: 'left', label: 'L' },
                    { key: 'right', label: 'R' }
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSelectedBattingSide(option.key as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedBattingSide === option.key
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                <select
                  value={lastAtBatsCount}
                  onChange={(e) => setLastAtBatsCount(Number(e.target.value))}
                  className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
                >
                  {[5, 10, 15, 20, 25].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
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
              <div className="relative w-48 h-48">
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
              
              {/* Color Key - Styled Legend */}
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

          {/* Timing Breakdown */}
          <div className="bg-gray-900 rounded-xl p-8 shadow-xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Timing Breakdown</h3>
            <div className="flex flex-col items-center">
              {(() => {
                const total = timingData.early + timingData.onTime + timingData.late
                
                if (total === 0) {
                  return (
                    <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">No timing data yet</p>
                        <p className="text-xs text-gray-500 mt-1">Record some at-bats to see your timing breakdown</p>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="relative w-48 h-48 mx-auto mb-8">
                    {/* Donut Chart with Gradients and Animation */}
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                      <defs>
                        {/* Gradient Definitions */}
                        <linearGradient id="earlyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#DC2626" />
                          <stop offset="100%" stopColor="#B91C1C" />
                        </linearGradient>
                        <linearGradient id="onTimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="lateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        
                        {/* Drop Shadow Filter */}
                        <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      
                      {/* Background Ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="12"
                        opacity="0.2"
                      />
                      
                      {(() => {
                        let currentAngle = 0
                        const slices = [
                          { value: timingData.early, gradient: 'url(#earlyGradient)', color: '#DC2626', label: 'Early' },
                          { value: timingData.onTime, gradient: 'url(#onTimeGradient)', color: '#10B981', label: 'On Time' },
                          { value: timingData.late, gradient: 'url(#lateGradient)', color: '#F59E0B', label: 'Late' }
                        ]
                        
                        // Filter out zero values and add gap between segments
                        const activeSlices = slices.filter(slice => slice.value > 0)
                        const gapAngle = activeSlices.length > 1 ? 3 : 0 // 3 degree gap between segments
                        const totalGaps = activeSlices.length * gapAngle
                        const availableAngle = 360 - totalGaps
                        
                        return activeSlices.map((slice, index) => {
                          const percentage = slice.value / total
                          const angle = percentage * availableAngle
                          
                          // Special case for single segment (100%) - use two half circles
                          if (activeSlices.length === 1 && percentage === 1) {
                            const outerRadius = 41
                            const innerRadius = 29
                            
                            return (
                              <g key={index}>
                                {/* First half circle */}
                                <path
                                  d={`M 50,${50 - outerRadius} A ${outerRadius},${outerRadius} 0 0,1 50,${50 + outerRadius} L 50,${50 + innerRadius} A ${innerRadius},${innerRadius} 0 0,0 50,${50 - innerRadius} Z`}
                                  fill={slice.gradient}
                                  filter="url(#dropShadow)"
                                  className="transition-all duration-300 ease-out hover:brightness-110 cursor-pointer"
                                  style={{
                                    animation: `fadeInSegment 0.8s ease-out 0s both`
                                  }}
                                />
                                {/* Second half circle */}
                                <path
                                  d={`M 50,${50 + outerRadius} A ${outerRadius},${outerRadius} 0 0,1 50,${50 - outerRadius} L 50,${50 - innerRadius} A ${innerRadius},${innerRadius} 0 0,0 50,${50 + innerRadius} Z`}
                                  fill={slice.gradient}
                                  filter="url(#dropShadow)"
                                  className="transition-all duration-300 ease-out hover:brightness-110 cursor-pointer"
                                  style={{
                                    animation: `fadeInSegment 0.8s ease-out 0.2s both`
                                  }}
                                />
                              </g>
                            )
                          }
                          
                          // Regular segment calculation for multiple segments
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle
                          
                          // Convert to radians for path calculation
                          const startRad = (startAngle * Math.PI) / 180
                          const endRad = (endAngle * Math.PI) / 180
                          
                          // Calculate path coordinates (outer radius 41, inner radius 29 for donut)
                          const outerRadius = 41
                          const innerRadius = 29
                          
                          const x1 = 50 + outerRadius * Math.cos(startRad)
                          const y1 = 50 + outerRadius * Math.sin(startRad)
                          const x2 = 50 + outerRadius * Math.cos(endRad)
                          const y2 = 50 + outerRadius * Math.sin(endRad)
                          
                          const x3 = 50 + innerRadius * Math.cos(endRad)
                          const y3 = 50 + innerRadius * Math.sin(endRad)
                          const x4 = 50 + innerRadius * Math.cos(startRad)
                          const y4 = 50 + innerRadius * Math.sin(startRad)
                      
                          const largeArcFlag = angle > 180 ? 1 : 0
                          
                          // Create path for donut segment with subtle curves
                          const pathData = [
                            `M ${x1} ${y1}`,
                            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            `Q ${(x2 + x3) / 2} ${(y2 + y3) / 2} ${x3} ${y3}`,
                            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                            `Q ${(x4 + x1) / 2} ${(y4 + y1) / 2} ${x1} ${y1}`,
                            'Z'
                          ].join(' ')
                          
                          currentAngle = endAngle + gapAngle
                      
                          return (
                            <path
                              key={index}
                              d={pathData}
                              fill={slice.gradient}
                              filter="url(#dropShadow)"
                              className="transition-all duration-300 ease-out hover:brightness-110 cursor-pointer"
                              style={{
                                animation: `fadeInSegment 0.8s ease-out ${index * 0.2}s both`
                              }}
                            />
                          )
                        })
                      })()}
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="text-2xl font-bold text-white mb-1">{total}</div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">At-Bats</div>
                    </div>
                  </div>
                )
              })()}
              
              {/* Enhanced Legend */}
              <div className="w-full max-w-xs space-y-4">
                {(() => {
                  const total = timingData.early + timingData.onTime + timingData.late
                  const getPercentage = (value: number) => 
                    total > 0 ? Math.round((value / total) * 100) : 0
                  
                  const legendItems = [
                    { key: 'early', label: 'Early', value: timingData.early, color: '#DC2626' },
                    { key: 'onTime', label: 'On Time', value: timingData.onTime, color: '#10B981' },
                    { key: 'late', label: 'Late', value: timingData.late, color: '#F59E0B' }
                  ]
                  
                  return legendItems.map((item, index) => (
                    <div 
                      key={item.key} 
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${0.8 + index * 0.1}s both`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-300 font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">{getPercentage(item.value)}%</div>
                        <div className="text-gray-400 text-xs font-normal">{item.value}</div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes fadeInSegment {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Hit Result Distribution */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Hit Result Distribution</h3>
            <div className="flex flex-col items-center">
              {(() => {
                const total = hitTypeData.grounder + hitTypeData.lineDrive + hitTypeData.flyball
                
                if (total === 0) {
                  return (
                    <div className="relative w-full max-w-lg mx-auto mb-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">No hit data yet</p>
                        <p className="text-xs text-gray-500 mt-1">Record some at-bats to see your hit distribution</p>
                      </div>
                    </div>
                  )
                }
                
                // Calculate percentages
                const grounderPct = (hitTypeData.grounder / total) * 100
                const lineDrivePct = (hitTypeData.lineDrive / total) * 100
                const flyballPct = (hitTypeData.flyball / total) * 100
                
                const segments = [
                  { key: 'grounder', label: 'Grounder', value: hitTypeData.grounder, pct: grounderPct, color: '#DC2626', bgColor: '#DC2626' },
                  { key: 'lineDrive', label: 'Line Drive', value: hitTypeData.lineDrive, pct: lineDrivePct, color: '#10B981', bgColor: '#10B981' },
                  { key: 'flyball', label: 'Flyball', value: hitTypeData.flyball, pct: flyballPct, color: '#F59E0B', bgColor: '#F59E0B' }
                ].filter(segment => segment.value > 0)
                
                return (
                  <div className="w-full max-w-lg mx-auto">
                    {/* Main Segmented Bar */}
                    <div className="relative w-full h-6 bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-4">
                      <svg width="100%" height="100%" className="absolute inset-0">
                        <defs>
                          {/* Gradient Definitions */}
                          <linearGradient id="grounderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#DC2626" />
                            <stop offset="100%" stopColor="#B91C1C" />
                          </linearGradient>
                          <linearGradient id="lineDriveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#047857" />
                          </linearGradient>
                          <linearGradient id="flyballGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                          
                          {/* Drop Shadow Filter */}
                          <filter id="barDropShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                        
                        {(() => {
                          let cumulativeWidth = 0
                          return segments.map((segment, index) => {
                            const segmentWidth = segment.pct
                            const x = cumulativeWidth
                            cumulativeWidth += segmentWidth
                            
                            const gradientId = segment.key === 'grounder' ? 'url(#grounderGradient)' :
                                             segment.key === 'lineDrive' ? 'url(#lineDriveGradient)' :
                                             'url(#flyballGradient)'
                            
                            return (
                              <rect
                                key={segment.key}
                                x={`${x}%`}
                                y="0"
                                width={`${segmentWidth}%`}
                                height="100%"
                                fill={gradientId}
                                filter="url(#barDropShadow)"
                                className="transition-all duration-300 ease-out hover:brightness-110"
                                style={{
                                  animation: `fadeInSegment 1.0s ease-out ${index * 0.2}s both`
                                }}
                              />
                            )
                          })
                        })()}
                      </svg>
                    </div>
                    
                    {/* Equal Column Labels Below Bar */}
                    <div className="w-full max-w-xs mx-auto py-3 px-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200">
                      <div className="grid grid-cols-3 gap-2 w-full">
                        {[
                          { key: 'grounder', label: 'Grounder', value: hitTypeData.grounder, pct: grounderPct, color: '#DC2626' },
                          { key: 'lineDrive', label: 'Line Drive', value: hitTypeData.lineDrive, pct: lineDrivePct, color: '#10B981' },
                          { key: 'flyball', label: 'Flyball', value: hitTypeData.flyball, pct: flyballPct, color: '#F59E0B' }
                        ].map((segment, index) => (
                          <div
                            key={segment.key}
                            className="text-center"
                            style={{
                              animation: `fadeInUp 0.8s ease-out ${0.6 + index * 0.15}s both`
                            }}
                          >
                            {/* Label */}
                            <div className="text-gray-300 font-medium text-sm mb-1">
                              {segment.label}
                            </div>
                            {/* Percentage and Count */}
                            <div className="space-y-0.5">
                              <div 
                                className="font-bold text-base leading-none"
                                style={{ color: segment.color }}
                              >
                                {Math.round(segment.pct)}%
                              </div>
                              <div className="text-gray-400 text-xs font-normal">
                                {segment.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
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
                if (profile?.hitting_side === 'switch') {
                  message += ` from ${selectedBattingSide} side`
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
  )
}
