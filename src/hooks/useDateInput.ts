import { useState, useCallback } from 'react'

interface UseDateInputReturn {
  value: string
  isValid: boolean
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  parsedDate: Date | null
}

export function useDateInput(initialValue: string = ''): UseDateInputReturn {
  const [value, setValue] = useState(initialValue)

  // Format date string with slashes
  const formatDateString = (input: string): string => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '')
    
    // Add slashes after month and day
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
  }

  // Validate the date string
  const isValidDate = (dateStr: string): boolean => {
    // Check if the format is correct (MM/DD/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false

    const [month, day, year] = dateStr.split('/').map(Number)
    const date = new Date(year, month - 1, day)

    // Check if the date is valid
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false
    }

    // Check age restrictions (4-100 years)
    const today = new Date()
    const minDate = new Date()
    minDate.setFullYear(today.getFullYear() - 100)
    const maxDate = new Date()
    maxDate.setFullYear(today.getFullYear() - 4)

    return date >= minDate && date <= maxDate
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Only allow numbers and slashes
    if (/[^\d/]/.test(input)) return

    // Limit total length
    if (input.replace(/\D/g, '').length > 8) return

    const formatted = formatDateString(input)
    setValue(formatted)
  }, [])

  // Parse the date string into a Date object if valid
  const getParsedDate = (dateStr: string): Date | null => {
    if (!isValidDate(dateStr)) return null
    const [month, day, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  }

  return {
    value,
    isValid: value.length === 10 && isValidDate(value),
    handleChange,
    parsedDate: getParsedDate(value)
  }
} 