/**
 * Normalizes batting side values to the exact format required by the database
 * Converts any case variant of "left" or "right" to "Left" or "Right"
 * 
 * @param value - The batting side value to normalize
 * @returns "Left" or "Right" in the exact format required by the database
 * @throws Error if the value is not a valid batting side
 */
export function normalizeBattingSide(value: string): 'Left' | 'Right' {
  if (!value || typeof value !== 'string') {
    throw new Error('Invalid batting side value: must be a non-empty string')
  }

  // Trim whitespace and convert to lowercase for comparison
  const normalized = value.trim().toLowerCase()
  
  if (normalized === 'left') {
    return 'Left'
  } else if (normalized === 'right') {
    return 'Right'
  } else {
    throw new Error(`Invalid batting side value: "${value}". Must be "left" or "right" (case insensitive)`)
  }
}

/**
 * Type guard to check if a value is a valid batting side
 */
export function isValidBattingSide(value: any): value is 'Left' | 'Right' {
  return value === 'Left' || value === 'Right'
}

/**
 * Converts batting side from internal format to display format
 * @param value - The batting side value ('Left' or 'Right')
 * @returns Lowercase version for display
 */
export function battingSideToDisplay(value: 'Left' | 'Right'): string {
  return value.toLowerCase()
}

/**
 * Converts batting side from display format to database format
 * @param value - The batting side value (any case)
 * @returns Properly capitalized version for database
 */
export function battingSideFromDisplay(value: string): 'Left' | 'Right' {
  return normalizeBattingSide(value)
} 