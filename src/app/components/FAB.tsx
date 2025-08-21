"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

export default function FAB() {
  // Temporarily hardcode hitting side until we implement Supabase auth
  const hittingSide = 'right'

  return (
    <Link
      href="/add"
      className="fixed bottom-24 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      aria-label="Add at-bat"
    >
      <Plus className="w-6 h-6" />
    </Link>
  )
} 