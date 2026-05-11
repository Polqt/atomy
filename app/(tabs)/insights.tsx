import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type HabitEntry } from '../../types/habit';
import { type HabitCheckin } from '../../services/habits';
import TabScreen from '@/components/TabScreen';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import { useWeeklyInsight } from '../../hooks/useWeeklyInsight';
import colors from '../../constants/colors';
import {
  buildCurrentWeekSummary,
  computeCurrentStreak,
  computeMostConsistentDay,
} from '@/utils/habit-stats';
import { formatWeekRange } from '@/utils/date';

const EMPTY = '#EBEBEB';

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SummarySkeleton() {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.skeletonWrap, animatedStyle]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '85%' }]} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </Animated.View>
  );
}

function MiniBars({ week }: { week: ReturnType<typeof buildCurrentWeekSummary> }) {
  const maxCompleted = Math.max(...week.map((day) => day.completedCount ?? 0), 0);

  return (
    <View style={styles.barRow}>
      {week.map((day) => {
        const completedCount = day.completedCount ?? 0;
        const height = maxCompleted > 0 ? Math.max(4, Math.round((completedCount / maxCompleted) * 32)) : 4;
        return (
          <View
            key={day.dateKey}
            style={[
              styles.miniBar,
              {
                height,
                backgroundColor: completedCount > 0 ? colors.primary : EMPTY,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function getBestHabitThisWeek(habits: HabitCheckin[], week: ReturnType<typeof buildCurrentWeekSummary>) {
  if (habits.length === 0 || week.length === 0) return null;
  const weekKeys = new Set(week.map((day) => day.dateKey));
  const byHabit = new Map<string, { name: string; completed: number; total: number }>();

  for (const habit of habits) {
    const dateKey = habit.created_at.slice(0, 10);
    if (!weekKeys.has(dateKey)) continue;
    if (!byHabit.has(habit.habit_id)) {
      byHabit.set(habit.habit_id, { name: habit.habit, completed: 0, total: 0 });
    }
    const stat = byHabit.get(habit.habit_id)!;
    stat.total += 1;
    if (habit.completed) stat.completed += 1;
  }

  let best: { name: string; completed: number; total: number } | null = null;
  for (const stat of byHabit.values()) {
    if (!best) {
      best = stat;
      continue;
    }
    const score = stat.completed / Math.max(stat.total, 1);
    const bestScore = best.completed / Math.max(best.total, 1);
    if (score > bestScore || (score === bestScore && stat.completed > best.completed)) best = stat;
  }

  return best && best.total > 0 ? best : null;
}

function EmptyInsights() {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.sparkleIcon}>
        <View style={styles.sparkleVertical} />
        <View style={styles.sparkleHorizontal} />
      </View>
      <Text style={styles.emptyTitle}>No insights yet</Text>
      <Text style={styles.emptyText}>Complete habits daily to unlock your insights</Text>
    </Card>
  );
}

function BreakdownChip({
  day,
}: {
  day: ReturnType<typeof buildCurrentWeekSummary>[number];
}) {
  const date = new Date(`${day.dateKey}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = date.getTime() === today.getTime();
  const isFuture = date.getTime() > today.getTime();
  const completedCount = day.completedCount ?? 0;

  return (
    <View style={[styles.dayChip, isToday && styles.dayChipToday]}>
      <Text style={styles.dayInitial}>
        {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
      </Text>
      <View
        style={[
          styles.dayStatus,
          completedCount > 0 && styles.dayStatusDone,
          day.completed === false && styles.dayStatusPartial,
          isFuture && styles.dayStatusFuture,
        ]}
      />
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { data: habits = [], isLoading: historyLoading } = useHabitHistory();
  const { mutate: fetchInsight, data: aiInsight, isPending: loading } = useWeeklyInsight();
  const requestedKeyRef = useRef('');

  const week = useMemo(() => buildCurrentWeekSummary(habits), [habits]);
  const trackedWeek = useMemo(() => week.filter((d) => d.completed !== null), [week]);
  const hasTrackedData = trackedWeek.length > 0;
  const weekRange = useMemo(() => formatWeekRange(week).replace(' - ', ' to '), [week]);
  const topDay = useMemo(() => computeMostConsistentDay(habits), [habits]);
  const streak = useMemo(() => computeCurrentStreak(habits), [habits]);
  const bestHabit = useMemo(() => getBestHabitThisWeek(habits, week), [habits, week]);

  const payload = useMemo<HabitEntry[]>(
    () =>
      habits
        .slice(0, 7)
        .filter((h) => typeof h.habit === 'string' && h.habit.trim().length > 0)
        .map((h) => ({ habit: h.habit.trim(), completed: h.completed })),
    [habits],
  );

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    if (payload.length === 0) return;
    if (requestedKeyRef.current === payloadKey) return;
    requestedKeyRef.current = payloadKey;
    fetchInsight(payload);
  }, [fetchInsight, payload, payloadKey]);

  const handleRefresh = () => {
    if (payload.length === 0 || loading) return;
    requestedKeyRef.current = payloadKey;
    fetchInsight(payload);
  };

  const summary = (aiInsight?.summary ?? '').trim();

  return (
    <TabScreen statusBarColor={colors.background}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(280)} style={styles.headerRow}>
          <Text style={styles.pageTitle}>Insights</Text>
          <Pressable
            onPress={handleRefresh}
            disabled={payload.length === 0 || loading}
            style={[styles.headerIconWrap, (payload.length === 0 || loading) && styles.headerIconDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Text style={styles.headerIcon}>↻</Text>
            )}
          </Pressable>
        </Animated.View>

        {historyLoading ? (
          <Card>
            <SummarySkeleton />
          </Card>
        ) : habits.length === 0 ? (
          <EmptyInsights />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(320).delay(40)}>
              <Card>
                <Text style={styles.cardTitle}>Your weekly summary</Text>
                <Text style={styles.cardDate}>{weekRange}</Text>

                {loading ? (
                  <SummarySkeleton />
                ) : hasTrackedData ? (
                  <Text style={styles.summaryText}>
                    {summary ||
                      `You completed ${trackedWeek.filter((day) => day.completed).length} out of ${trackedWeek.length} tracked days this week. Your strongest day was ${topDay}. Keep the momentum going.`}
                  </Text>
                ) : (
                  <View style={styles.noDataBox}>
                    <Text style={styles.noDataTitle}>No data yet</Text>
                    <Text style={styles.noDataText}>Check off habits to unlock the summary.</Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(320).delay(80)}>
              <Card>
                <View style={styles.performanceSection}>
                  <View>
                    <Text style={styles.smallLabel}>Most consistent day</Text>
                    <Text style={styles.greenValue}>{topDay}</Text>
                  </View>
                  <MiniBars week={week} />
                </View>

                <View style={styles.innerDivider} />

                <View style={styles.streakRow}>
                  <Text style={styles.metricTitle}>Current streak</Text>
                  <Text style={[styles.streakValue, streak > 0 ? styles.streakActive : styles.streakMuted]}>
                    {streak} {streak > 0 ? '🔥' : '⚪'}
                  </Text>
                </View>
              </Card>
            </Animated.View>

            {bestHabit ? (
              <Animated.View entering={FadeInDown.duration(320).delay(120)}>
                <Card>
                  <Text style={styles.bestLabel}>Best habit this week</Text>
                  <Text style={styles.bestName}>{bestHabit.name}</Text>
                  <View style={styles.bestPill}>
                    <Text style={styles.bestPillText}>
                      {bestHabit.completed} of {bestHabit.total} days
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.duration(320).delay(160)}>
              <Card>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.weekChips}>
                    {week.map((day) => (
                      <BreakdownChip key={day.dateKey} day={day} />
                    ))}
                  </View>
                </ScrollView>
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  headerIconDisabled: {
    opacity: 0.45,
  },
  headerIcon: {
    color: colors.muted,
    fontSize: 19,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardDate: {
    marginTop: 3,
    marginBottom: 18,
    fontSize: 13,
    color: colors.muted,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.text,
  },
  skeletonWrap: {
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: EMPTY,
    width: '100%',
  },
  noDataBox: {
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderRadius: 12,
    padding: 14,
  },
  noDataTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  noDataText: {
    fontSize: 12,
    color: '#2F8F4E',
  },
  performanceSection: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  smallLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  greenValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  barRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  miniBar: {
    width: 6,
    borderRadius: 3,
  },
  innerDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  streakValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  streakActive: {
    color: colors.primary,
  },
  streakMuted: {
    color: colors.muted,
  },
  bestLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  bestName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  bestPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bestPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  weekChips: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    width: 44,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dayChipToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayInitial: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
  },
  dayStatus: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#CFCFCF',
  },
  dayStatusDone: {
    backgroundColor: colors.primary,
  },
  dayStatusPartial: {
    backgroundColor: '#A4DDB6',
  },
  dayStatusFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D8D8D8',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 38,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52,199,89,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sparkleVertical: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: 'rgba(52,199,89,0.55)',
  },
  sparkleHorizontal: {
    position: 'absolute',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(52,199,89,0.55)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
