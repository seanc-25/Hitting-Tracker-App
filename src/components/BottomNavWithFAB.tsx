'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNavWithFAB() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Data',
      href: '/data',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Videos',
      href: '/videos',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {/* Video library style: screen with play triangle (slightly taller rectangle) */}
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="2" />
          <path d="M10 10l5 3-5 3v-6z" fill="currentColor" />
        </svg>
      )
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Main container with relative positioning for FAB */}
      <div className="relative">
        {/* Floating Action Button */}
        <Link
          href="/add"
          className="absolute left-1/2 transform -translate-x-1/2 -top-6 z-40 w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
          aria-label="Add At-Bat"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* Bottom Navigation Bar */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 h-20">
          <div className="flex justify-between items-center h-full max-w-md mx-auto">
            {/* Left side - First two nav items */}
            <div className="flex flex-1 justify-around">
              {navItems.slice(0, 2).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="mb-1">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Center space for FAB */}
            <div className="w-16 flex-shrink-0"></div>

            {/* Right side - Last two nav items */}
            <div className="flex flex-1 justify-around">
              {navItems.slice(2, 4).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="mb-1">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 