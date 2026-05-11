/**
 * Unified Date & Time Utilities
 */

type DateLabel = {
  label: string;
  sub: string;
};

/**
 * Format date for display (e.g., "Monday, May 11, 2025 at 10:30 AM")
 */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Re-export for backwards compatibility
export { formatDateLong as formatDate };

/**
 * Format date for section headers (Today, Yesterday, or Weekday)
 */
export function formatSectionDate(iso: string): DateLabel {
  const date = parseDateOnly(iso);
  const today = getStartOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return { 
      label: 'Today', 
      sub: formatMonthDay(iso) 
    };
  }
  
  if (isSameDay(date, yesterday)) {
    return { 
      label: 'Yesterday', 
      sub: formatMonthDay(iso) 
    };
  }

  return {
    label: formatWeekday(iso),
    sub: formatMonthDay(iso),
  };
}

/**
 * Format time only (e.g., "10:30 AM")
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for history display (e.g., "May 11")
 */
export function formatMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get weekday name (e.g., "Monday")
 */
export function formatWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Parse ISO date string to start of day
 */
export function parseDateOnly(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

/**
 * Get start of day (midnight)
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get day of year (0-365)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get day progress (0-1) - percentage of day passed
 */
export function getDayProgress(): number {
  const now = new Date();
  return (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
}

/**
 * Format week range for insights (e.g., "May 5 - May 11")
 */
export function formatWeekRange(week: Array<{ dateKey: string }>): string {
  if (week.length === 0) return '';
  const first = new Date(week[0].dateKey);
  const last = new Date(week[week.length - 1].dateKey);
  const startMonth = first.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = last.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${first.getDate()} - ${last.getDate()}`;
  }
  return `${startMonth} ${first.getDate()} - ${endMonth} ${last.getDate()}`;
}

/**
 * Group habits by date for section list
 */
export type SectionData<T> = {
  title: string;
  data: T[];
};

export function groupByDate<T extends { id: string; created_at: string }>(habits: T[]): SectionData<T>[] {
  const groups = new Map<string, T[]>();
  
  for (const habit of habits) {
    const dateKey = habit.created_at.slice(0, 10);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(habit);
  }

  // Sort by date descending
  const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([dateKey, data]) => ({
    title: dateKey,
    data,
  }));
}