/**
 * API Configuration Constants
 */

export const API = {
  /** Request timeout in milliseconds */
  TIMEOUT_MS: 10_000,
  
  /** Number of retry attempts for failed requests */
  RETRY_COUNT: 1,
  
  /** Default stale time for React Query (30 seconds) */
  STALE_TIME_MS: 30_000,
  
  /** Garbage collection time for React Query cache (5 minutes) */
  GC_TIME_MS: 5 * 60 * 1000,
} as const;

/** Notification scheduling constants */
export const NOTIFICATIONS = {
  /** Default reminder hour (9 AM) */
  DEFAULT_HOUR: 9,
  
  /** Default reminder minute */
  DEFAULT_MINUTE: 0,
} as const;