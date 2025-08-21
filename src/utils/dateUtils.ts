import { format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Los_Angeles'

/**
 * Formats a date for storage in the database (YYYY-MM-DD format)
 * Ensures the date is stored without timezone conversion issues
 */
export function formatDateForStorage(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a date string for display (MM/DD/YYYY format)
 * Converts from YYYY-MM-DD to MM/DD/YYYY
 */
export function formatDateForDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${month}/${day}/${year}`
}

/**
 * Formats a date for localized display using the user's locale
 * Converts from YYYY-MM-DD to localized format
 */
export function formatDateForLocaleDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formats a UTC timestamp to America/Los_Angeles timezone for display
 * This prevents off-by-one-day errors when displaying database timestamps
 * 
 * Examples:
 * - UTC '2024-01-01T08:00:00.000Z' → '12/31/2023' (PST, 8 hours behind)
 * - UTC '2024-06-15T10:00:00.000Z' → '06/15/2024' (PDT, 7 hours behind)
 * 
 * @param utcTimestamp - UTC timestamp string from database
 * @param formatString - Optional format string (default: 'MM/dd/yyyy')
 * @returns Formatted date string in America/Los_Angeles timezone
 */
export function formatTimestampForDisplay(utcTimestamp: string, formatString: string = 'MM/dd/yyyy'): string {
  try {
    // Parse the UTC timestamp
    const utcDate = new Date(utcTimestamp)
    
    // Convert to America/Los_Angeles timezone
    const zonedDate = toZonedTime(utcDate, TIMEZONE)
    
    // Format the date
    return format(zonedDate, formatString)
  } catch (error) {
    console.error('Error formatting timestamp:', error)
    // Fallback to basic formatting if there's an error
    return new Date(utcTimestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }
}

/**
 * Formats a UTC timestamp to America/Los_Angeles timezone with time
 * 
 * @param utcTimestamp - UTC timestamp string from database
 * @returns Formatted date and time string in America/Los_Angeles timezone
 */
export function formatTimestampWithTime(utcTimestamp: string): string {
  try {
    const utcDate = new Date(utcTimestamp)
    const zonedDate = toZonedTime(utcDate, TIMEZONE)
    
    return format(zonedDate, 'MM/dd/yyyy h:mm a')
  } catch (error) {
    console.error('Error formatting timestamp with time:', error)
    return new Date(utcTimestamp).toLocaleString('en-US', {
      timeZone: TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

/**
 * Gets the current date in America/Los_Angeles timezone for date inputs
 * Returns YYYY-MM-DD format
 */
export function getCurrentDateInTimezone(): string {
  const now = new Date()
  const zonedDate = toZonedTime(now, TIMEZONE)
  return formatDateForStorage(zonedDate)
}

/**
 * Converts a date from America/Los_Angeles timezone to UTC for storage
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns UTC Date object
 */
export function convertDateToUtc(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return fromZonedTime(localDate, TIMEZONE)
} 