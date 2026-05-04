export const queryKeys = {
  habits: ['habits'] as const,
  todayHabits: ['habits', 'today'] as const,
  streak: ['habits', 'streak'] as const,
} as const;
