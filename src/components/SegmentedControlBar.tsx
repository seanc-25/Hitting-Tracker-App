'use client'

import React from 'react'

export interface SegmentedControlBarProps {
  value: 1 | 2 | 3 | 4 | 5
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void
  className?: string
  ariaLabel?: string
}

/**
 * Mobile-optimized segmented control bar (1-5) with a sliding indicator.
 * - Full-width, rounded container with subtle border (dark theme)
 * - Five equal segments (buttons)
 * - Animated rounded indicator sliding behind selected segment
 */
export default function SegmentedControlBar({
  value,
  onChange,
  className = '',
  ariaLabel = 'Segmented control',
}: SegmentedControlBarProps) {
  const segments = [1, 2, 3, 4, 5] as const
  const index = Math.max(0, Math.min(4, value - 1))
  const indicatorLeftPercent = index * 20

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative w-full rounded-xl border border-gray-700 bg-gray-800 overflow-hidden ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Sliding indicator */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 rounded-xl bg-blue-600 transition-[left] duration-200 ease-out"
        style={{ left: `${indicatorLeftPercent}%`, width: '20%' }}
      />

      {/* Buttons */}
      <div className="relative z-10 grid grid-cols-5">
        {segments.map((seg) => {
          const selected = seg === value
          return (
            <button
              key={seg}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(seg)}
              className={`h-12 w-full flex items-center justify-center select-none text-base font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:z-20 ${
                selected ? 'text-blue-100' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {seg}
            </button>
          )
        })}
      </div>
    </div>
  )
}


