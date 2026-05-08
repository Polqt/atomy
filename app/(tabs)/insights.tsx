import { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { type HabitEntry } from '../../services/ai';
import TabScreen from '@/components/TabScreen';
import MiniBarGroup from '@/components/MiniBarGroup';
import { useHabits } from '../../hooks/useHabits';
import { useWeeklyInsight } from '../../hooks/useWeeklyInsight';
import colors from '../../constants/colors';
import {
  buildRecentDaySummary,
  computeCurrentStreak,
  computeMostConsistentDay,
  getCompletionRate,
} from '@/utils/habit-stats';
import { formatWeekRange } from '@/utils/time';
import { getFallbackWeeklyInsight } from '@/utils/insights';


export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { data: habits = [] } = useHabits();
  const { mutate: fetchInsight, data: aiInsight, isPending: loading } = useWeeklyInsight();
  const requestedKeyRef = useRef('');

  const week = useMemo(() => buildRecentDaySummary(habits, 7), [habits]);
  const trackedWeek = useMemo(() => week.filter((d) => d.completed !== null), [week]);
  const completedWeek = useMemo(() => week.filter((d) => d.completed === true), [week]);
  const completionRate = getCompletionRate(completedWeek.length, trackedWeek.length);
  const hasTrackedData = trackedWeek.length > 0;
  const weekRange = useMemo(() => formatWeekRange(week), [week]);
  const topDay = useMemo(() => computeMostConsistentDay(habits), [habits]);
  const streak = useMemo(() => computeCurrentStreak(habits), [habits]);

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

  const computedFallback = useMemo(
    () => getFallbackWeeklyInsight(completionRate, trackedWeek.length, completedWeek.length),
    [completionRate, trackedWeek.length, completedWeek.length],
  );

  const summary = (aiInsight?.summary ?? '').trim() || computedFallback.summary;
  const insight = (aiInsight?.insight ?? '').trim() || computedFallback.insight;

  return (
    <TabScreen statusBarColor={colors.background}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(280)} style={styles.headerRow}>
          <Text style={styles.pageTitle}>Insights</Text>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>◷</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(360).delay(60)} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Your weekly summary</Text>
          <Text style={styles.summaryDate}>{weekRange}</Text>

          {hasTrackedData ? (
            <View style={styles.summaryTop}>
              <View style={styles.ringWrap}>
                <View style={styles.ringOuter}>
                  <Text style={styles.ringText}>{completionRate}%</Text>
                </View>
              </View>
              <View style={styles.summaryTopRight}>
                <Text style={styles.goodJobText}>{completionRate >= 70 ? 'Great job!' : 'Keep going!'}</Text>
                <Text style={styles.summaryBodyText}>{summary}</Text>
                <Text style={styles.summaryBodySub}>
                  You completed {completedWeek.length} out of {trackedWeek.length} tracked days this week.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptySummaryBlock}>
              <Text style={styles.emptySummaryTitle}>No data yet</Text>
              <Text style={styles.emptySummaryText}>Start checking off habits to unlock your weekly summary.</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metricTextBlock}>
              <Text style={styles.metricTitle}>Top performance</Text>
              <Text style={styles.metricSubtitle}>Most consistent day</Text>
              <Text style={styles.metricValue}>{topDay}</Text>
            </View>
            <MiniBarGroup week={week} />
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRowSingle}>
            <Text style={styles.metricTitle}>Current streak</Text>
            <Text style={styles.metricStreak}>
              {streak} day{streak === 1 ? '' : 's'} 🔥
            </Text>
          </View>

          {!loading && hasTrackedData ? <Text style={styles.insightLine}>{insight}</Text> : null}
        </Animated.View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  },
  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  summaryDate: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  ringWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  ringText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  summaryTopRight: {
    flex: 1,
  },
  goodJobText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  summaryBodyText: {
    color: '#374151',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },
  summaryBodySub: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  emptySummaryBlock: {
    backgroundColor: colors.primaryPale,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: 12,
    marginBottom: 14,
  },
  emptySummaryTitle: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySummaryText: {
    color: '#15803D',
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metricTextBlock: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  metricRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricStreak: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  insightLine: {
    marginTop: 10,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },
});
