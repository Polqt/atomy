import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabScreen from '@/components/TabScreen';
import { type HabitEntry } from '../../types/habit';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import { useWeeklyInsight } from '../../hooks/useWeeklyInsight';
import colors from '../../constants/colors';
import { buildCurrentWeekSummary, computeCurrentStreak, computeMostConsistentDay } from '@/utils/habit-stats';
import { formatWeekRange } from '@/utils/date';

const EMPTY = '#E5E5EA';

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function RefreshIcon() {
  return <Text style={styles.refreshIcon}>⟳</Text>;
}

function TrophyIcon() {
  return (
    <View style={styles.trophyCircle}>
      <Text style={styles.trophyText}>🏆</Text>
    </View>
  );
}

function StarIcon() {
  return (
    <View style={styles.starCircle}>
      <Text style={styles.starText}>★</Text>
    </View>
  );
}

function MiniBars({ week }: { week: ReturnType<typeof buildCurrentWeekSummary> }) {
  const max = Math.max(...week.map((day) => day.completedCount ?? 0), 0);
  return (
    <View style={styles.barRow}>
      {week.map((day) => {
        const count = day.completedCount ?? 0;
        return (
          <View
            key={day.dateKey}
            style={[
              styles.bar,
              {
                height: max > 0 ? Math.max(4, Math.round((count / max) * 32)) : 4,
                backgroundColor: count > 0 ? colors.primary : EMPTY,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function bestHabit(history: ReturnType<typeof useHabitHistory>['data'], week: ReturnType<typeof buildCurrentWeekSummary>) {
  const rows = history ?? [];
  const weekKeys = new Set(week.map((day) => day.dateKey));
  const map = new Map<string, { name: string; completed: number; total: number }>();
  rows.forEach((entry) => {
    if (!weekKeys.has(entry.checkin_date || entry.created_at.slice(0, 10))) return;
    const stat = map.get(entry.habit_id) ?? { name: entry.habit, completed: 0, total: 0 };
    stat.total += 1;
    if (entry.completed) stat.completed += 1;
    map.set(entry.habit_id, stat);
  });
  return [...map.values()].sort((a, b) => b.completed - a.completed)[0] ?? null;
}

function WeeklyChips({ week }: { week: ReturnType<typeof buildCurrentWeekSummary> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    <Card>
      <View style={styles.weekRow}>
        {week.map((day) => {
          const date = new Date(`${day.dateKey}T00:00:00`);
          const isToday = date.getTime() === today.getTime();
          const complete = (day.completedCount ?? 0) > 0;
          return (
            <View key={day.dateKey} style={[styles.dayChip, isToday && styles.dayChipToday, complete && styles.dayChipDone]}>
              <Text style={[styles.dayInitial, complete && styles.dayInitialDone]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
              </Text>
              <View style={[styles.dayDot, complete && styles.dayDotDone]} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { data: history = [], isLoading } = useHabitHistory();
  const { mutate: fetchInsight, data: aiInsight, isPending } = useWeeklyInsight();
  const requestedKeyRef = useRef('');
  const week = useMemo(() => buildCurrentWeekSummary(history), [history]);
  const weekRange = useMemo(() => formatWeekRange(week).replace(' - ', ' to '), [week]);
  const topDay = useMemo(() => computeMostConsistentDay(history), [history]);
  const streak = useMemo(() => computeCurrentStreak(history), [history]);
  const best = useMemo(() => bestHabit(history, week), [history, week]);
  const payload = useMemo<HabitEntry[]>(
    () => history.slice(0, 7).map((entry) => ({ habit: entry.habit, completed: entry.completed })),
    [history],
  );
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    if (payload.length === 0 || requestedKeyRef.current === payloadKey) return;
    requestedKeyRef.current = payloadKey;
    fetchInsight(payload);
  }, [fetchInsight, payload, payloadKey]);

  const completedWeek = week.filter((day) => day.completed === true).length;
  const trackedWeek = week.filter((day) => day.completed !== null).length;
  const summary =
    aiInsight?.summary ||
    `You completed ${completedWeek} out of ${trackedWeek} tracked days this week.\n\nYour strongest day was ${topDay}.`;

  return (
    <TabScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Pressable
            style={styles.iconButton}
            disabled={payload.length === 0 || isPending}
            onPress={() => {
              requestedKeyRef.current = payloadKey;
              fetchInsight(payload);
            }}
          >
            {isPending ? <ActivityIndicator color={colors.muted} size="small" /> : <RefreshIcon />}
          </Pressable>
        </View>

        <Card>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly Summary</Text>
              <Text style={styles.dateRange}>{weekRange}</Text>
            </View>
            <TrophyIcon />
          </View>
          <Text style={styles.summaryText}>{isLoading ? 'Loading your weekly summary.' : summary}</Text>
        </Card>

        <Card>
          <View style={styles.performanceTop}>
            <View>
              <Text style={styles.smallLabel}>Most consistent day</Text>
              <Text style={styles.greenValue}>{topDay}</Text>
            </View>
            <MiniBars week={week} />
          </View>
          <View style={styles.divider} />
          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>Current streak</Text>
            <Text style={styles.streakValue}>{streak} days 🔥</Text>
          </View>
        </Card>

        {best ? (
          <Card style={styles.bestCard}>
            <View style={styles.bestCopy}>
              <Text style={styles.smallLabel}>Best habit this week</Text>
              <Text style={styles.bestName}>{best.name}</Text>
              <Text style={styles.bestRate}>{best.completed} of {best.total} days</Text>
            </View>
            <StarIcon />
          </Card>
        ) : null}

        <WeeklyChips week={week} />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  refreshIcon: {
    fontSize: 24,
    color: colors.text,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dateRange: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
  },
  trophyCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyText: {
    fontSize: 20,
  },
  summaryText: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  performanceTop: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  greenValue: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  barRow: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  streakValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  bestCard: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestCopy: {
    flex: 1,
  },
  bestName: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  bestRate: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  starCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 44,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F4F7F4',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dayChipDone: {
    backgroundColor: colors.primary,
  },
  dayChipToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayInitial: {
    fontSize: 11,
    color: colors.muted,
  },
  dayInitialDone: {
    color: '#FFFFFF',
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D8D8D8',
  },
  dayDotDone: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
