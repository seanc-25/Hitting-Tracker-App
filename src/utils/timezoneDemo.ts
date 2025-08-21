/**
 * Demonstration of timezone-aware date formatting
 * This file shows how UTC timestamps are converted to America/Los_Angeles timezone
 * to prevent off-by-one date errors in the UI.
 */

import { formatTimestampForDisplay, formatDateForLocaleDisplay } from './dateUtils'

// Example 1: UTC timestamp that would show wrong date without timezone conversion
const utcTimestampExample1 = '2024-01-01T08:00:00.000Z' // 8:00 AM UTC on Jan 1
console.log('UTC Timestamp:', utcTimestampExample1)
console.log('Without timezone conversion:', new Date(utcTimestampExample1).toLocaleDateString())
console.log('With America/Los_Angeles conversion:', formatTimestampForDisplay(utcTimestampExample1))
console.log('---')

// Example 2: Summer time (PDT) example
const utcTimestampExample2 = '2024-06-15T10:00:00.000Z' // 10:00 AM UTC on Jun 15
console.log('UTC Timestamp:', utcTimestampExample2)
console.log('Without timezone conversion:', new Date(utcTimestampExample2).toLocaleDateString())
console.log('With America/Los_Angeles conversion:', formatTimestampForDisplay(utcTimestampExample2))
console.log('---')

// Example 3: Simple date string (no timezone issues)
const simpleDateString = '2024-01-15'
console.log('Simple date string:', simpleDateString)
console.log('Formatted for display:', formatDateForLocaleDisplay(simpleDateString))

/**
 * Key Benefits:
 * 
 * 1. Prevents off-by-one date errors:
 *    - UTC '2024-01-01T08:00:00.000Z' shows as '12/31/2023' in PST
 *    - Without conversion, might show as '01/01/2024' depending on user's system
 * 
 * 2. Handles daylight saving time automatically:
 *    - PST (Pacific Standard Time): UTC-8 in winter
 *    - PDT (Pacific Daylight Time): UTC-7 in summer
 * 
 * 3. Consistent display regardless of user's system timezone:
 *    - All users see dates in America/Los_Angeles timezone
 *    - No confusion from different users seeing different dates
 */ 