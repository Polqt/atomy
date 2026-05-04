export const queryKeys = {
  habits: ['habits'] as const,
  todayHabit: ['habits', 'today'] as const,
  streak: ['habits', 'streak'] as const,
} as const;
