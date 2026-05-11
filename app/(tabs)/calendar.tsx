import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabScreen from '@/components/TabScreen';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import colors from '../../constants/colors';

const DAYS_IN_WEEK = 7;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DayStatus = 'completed' | 'skipped' | 'none';

interface DayData {
  date: Date;
  status: DayStatus;
  completedCount: number;
  skippedCount: number;
}

function ProgressRing({
  progress,
  size,
  strokeWidth,
  showRing,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  showRing: boolean;
}) {
  const segments = 24;
  const filledSegments = Math.round(Math.max(0, Math.min(progress, 1)) * segments);
  const segmentWidth = strokeWidth;
  const segmentHeight = 5;
  const radius = size / 2 - strokeWidth / 2;

  if (!showRing) return null;

  return (
    <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2 }]}>
      {Array.from({ length: segments }).map((_, index) => {
        const angle = (360 / segments) * index;
        const radians = (Math.PI / 180) * angle;
        const left = size / 2 + Math.sin(radians) * radius - segmentWidth / 2;
        const top = size / 2 - Math.cos(radians) * radius - segmentHeight / 2;
        return (
          <View
            key={index}
            style={[
              styles.ringSegment,
              {
                width: segmentWidth,
                height: segmentHeight,
                left,
                top,
                borderRadius: segmentWidth / 2,
                backgroundColor: index < filledSegments ? colors.primary : '#E5E7EB',
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthData(habits: { created_at: string; completed: boolean }[], year: number, month: number): DayData[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const habitByDate: Record<string, { completed: boolean }[]> = {};

  habits.forEach((habit) => {
    const date = new Date(habit.created_at);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!habitByDate[dateKey]) {
      habitByDate[dateKey] = [];
    }
    habitByDate[dateKey].push({ completed: habit.completed });
  });

  const days: DayData[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      date: new Date(year, month, -startDayOfWeek + i + 1),
      status: 'none',
      completedCount: 0,
      skippedCount: 0,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const dayHabits = habitByDate[dateKey] || [];
    const completedCount = dayHabits.filter((h) => h.completed).length;
    const skippedCount = dayHabits.filter((h) => !h.completed).length;
    const totalHabits = completedCount + skippedCount;
    let status: DayStatus = 'none';

    if (totalHabits > 0) {
      status = completedCount > 0 ? 'completed' : 'skipped';
    }

    days.push({
      date: new Date(year, month, day),
      status,
      completedCount,
      skippedCount,
    });
  }

  return days;
}

function DayCell({
  day,
  isToday,
  isCurrentMonth,
  cellSize,
}: {
  day: DayData;
  isToday: boolean;
  isCurrentMonth: boolean;
  cellSize: number;
}) {
  const today = new Date();
  const isFuture = day.date > today && !isSameCalendarDay(day.date, today);
  const totalCount = day.completedCount + day.skippedCount;
  const showRing = isCurrentMonth && totalCount > 0 && !isFuture;
  const progress = totalCount > 0 ? day.completedCount / totalCount : 0;
  const textColor = !isCurrentMonth || isFuture ? colors.muted : colors.text;
  const ringSize = isToday ? 34 : 32;
  const strokeWidth = isToday ? 3 : 2;

  return (
    <View style={[styles.dayCell, { width: cellSize, height: cellSize }]}>
      <View style={[styles.dayNumberWrap, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
        <ProgressRing progress={progress} size={ringSize} strokeWidth={strokeWidth} showRing={showRing || isToday} />
        <Text style={[styles.dayText, { color: textColor }]}>{day.date.getDate()}</Text>
      </View>
    </View>
  );
}

function MonthView({
  year,
  month,
  habits,
  canGoNext,
  onMonthChange,
}: {
  year: number;
  month: number;
  habits: { created_at: string; completed: boolean }[];
  canGoNext: boolean;
  onMonthChange: (direction: 'prev' | 'next') => void;
}) {
  const { width } = useWindowDimensions();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const cellSize = Math.floor((Math.min(width, 430) - 96) / DAYS_IN_WEEK);
  const monthData = useMemo(() => getMonthData(habits, year, month), [habits, year, month]);

  return (
    <View style={styles.monthContainer}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => onMonthChange('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <Pressable
          onPress={canGoNext ? () => onMonthChange('next') : undefined}
          disabled={!canGoNext}
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={[styles.weekdayCell, { width: cellSize }]}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {monthData.map((day, index) => (
          <DayCell
            key={`${day.date.toISOString()}-${index}`}
            day={day}
            isToday={isCurrentMonth && day.date.getDate() === today.getDate()}
            isCurrentMonth={day.date.getMonth() === month}
            cellSize={cellSize}
          />
        ))}
      </View>
    </View>
  );
}

function Legend() {
  return (
    <View style={styles.legend}>
      <Text style={styles.legendText}>Ring fill equals completion rate for that day</Text>
    </View>
  );
}

function MonthStats({ habits, year, month }: { habits: { created_at: string; completed: boolean }[]; year: number; month: number }) {
  const stats = useMemo(() => {
    const monthData = getMonthData(habits, year, month);
    let completed = 0;
    let skipped = 0;
    let tracked = 0;

    monthData.forEach((day) => {
      if (day.date.getMonth() !== month || day.date.getFullYear() !== year) return;
      if (day.status === 'completed') {
        completed++;
        tracked++;
      } else if (day.status === 'skipped') {
        skipped++;
        tracked++;
      }
    });

    return { completed, skipped, tracked };
  }, [habits, year, month]);

  return (
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{stats.completed}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={[styles.statNumber, styles.statSkipped]}>{stats.skipped}</Text>
        <Text style={styles.statLabel}>Skipped</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{stats.tracked}</Text>
        <Text style={styles.statLabel}>Days Tracked</Text>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { data: habits = [] } = useHabitHistory();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const canGoNext = currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth());

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
      return;
    }

    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <TabScreen statusBarColor={colors.background}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Text style={styles.pageTitle}>Calendar</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(120)} style={styles.calendarCard}>
          <MonthView
            year={currentYear}
            month={currentMonth}
            habits={habits}
            canGoNext={canGoNext}
            onMonthChange={handleMonthChange}
          />
          <Legend />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(180)}>
          <MonthStats habits={habits} year={currentYear} month={currentMonth} />
        </Animated.View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.2,
    marginBottom: 22,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  monthContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  navButtonTextDisabled: {
    color: colors.muted,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  weekdayCell: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.3,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute',
  },
  ringSegment: {
    position: 'absolute',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendText: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statSkipped: {
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
