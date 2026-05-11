/**
 * User-related utilities
 */
import { getDayProgress } from './date';

/**
 * Extract display name from email address
 */
export function getDisplayNameFromEmail(email: string | null | undefined, fallback = 'User'): string {
  const localPart = email?.split('@')[0]?.trim();
  if (!localPart) return fallback;
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

/**
 * Get first letter/initial from a name
 */
export function getInitial(value: string, fallback = 'U'): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Get time-based greeting
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Re-export for backwards compatibility
export { getDayProgress };