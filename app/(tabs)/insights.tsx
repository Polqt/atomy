import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { type HabitRow } from '../../services/habits';
import { type WeeklyInsightResult } from '../../services/ai';
import TabBar from '../../components/TabBar';
import { useHabits } from '../../hooks/useHabits';
import { useWeeklyInsight } from '../../hooks/useWeeklyInsight';

const { width } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_PALE = '#F0FDF4';
const GREEN_LIGHT = '#DCFCE7';
const GREEN_MID = '#86EFAC';
const CREAM = '#FAFAF8';
const INK = '#0A0A0A';
const MUTED = '#9CA3AF';
const SOFT = '#F9FAFB';
const BORDER = '#F3F4F6';

// Build last-7-days data from habit rows
type DayBar = {
  day: string;   // 'M', 'T', etc.
  date: string;  // YYYY-MM-DD
  completed: boolean | null;
};

function buildWeekBars(habits: HabitRow[]): DayBar[] {
  const byDate = new Map<string, boolean>();
  for (const h of habits) {
    const d = h.created_at.slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, h.completed);
    else if (h.completed) byDate.set(d, true);
  }

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const bars: DayBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    bars.push({
      day: days[d.getDay()],
      date: iso,
      completed: byDate.has(iso) ? byDate.get(iso)! : null,
    });
  }
  return bars;
}

// Animated progress arc using border trick
function ProgressRing({ rate, total, completed }: { rate: number; total: number; completed: number }) {
  const animatedRate = useSharedValue(0);

  useEffect(() => {
    animatedRate.value = withDelay(
      300,
      withTiming(rate, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
  }, [rate]);

  // We render a 3/4-circle arc using two clipped halves
  const RING = 130;
  const STROKE = 10;
  const INNER = RING - STROKE * 2;

  const fillStyle = useAnimatedStyle(() => ({
    opacity: animatedRate.value > 0 ? 1 : 0,
  }));

  return (
    <View style={styles.ringWrap}>
      {/* Track ring */}
      <View style={[styles.ringTrack, { width: RING, height: RING, borderRadius: RING / 2, borderWidth: STROKE }]} />

      {/* Filled arc overlay — simple approach: colored border that animates opacity + a number */}
      <Animated.View
        style={[
          styles.ringFill,
          { width: RING, height: RING, borderRadius: RING / 2, borderWidth: STROKE },
          fillStyle,
        ]}
      />

      {/* Center content */}
      <View style={styles.ringCenter}>
        <Animated.Text entering={FadeIn.duration(600).delay(400)} style={styles.ringPct}>
          {Math.round(rate * 100)}
          <Text style={styles.ringPctSign}>%</Text>
        </Animated.Text>
        <Animated.Text entering={FadeIn.duration(400).delay(600)} style={styles.ringLabel}>
          this week
        </Animated.Text>
      </View>

      {/* Stats below ring */}
      <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.ringStats}>
        <View style={styles.ringStat}>
          <Text style={styles.ringStatNum}>{completed}</Text>
          <Text style={styles.ringStatLabel}>done</Text>
        </View>
        <View style={styles.ringStatDivider} />
        <View style={styles.ringStat}>
          <Text style={styles.ringStatNum}>{total - completed}</Text>
          <Text style={styles.ringStatLabel}>skipped</Text>
        </View>
        <View style={styles.ringStatDivider} />
        <View style={styles.ringStat}>
          <Text style={styles.ringStatNum}>{total}</Text>
          <Text style={styles.ringStatLabel}>total</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// 7-day bar chart
function WeekBars({ bars }: { bars: DayBar[] }) {
  return (
    <Animated.View entering={FadeInUp.duration(480).delay(260)} style={styles.barsCard}>
      <Text style={styles.barsTitle}>7-day rhythm</Text>
      <View style={styles.barsRow}>
        {bars.map((bar, i) => {
          const barH = useSharedValue(0);
          useEffect(() => {
            barH.value = withDelay(
              i * 60 + 400,
              withSpring(bar.completed === true ? 1 : bar.completed === false ? 0.35 : 0.08, {
                damping: 18,
                stiffness: 180,
              }),
            );
          }, [bar.completed]);

          const barStyle = useAnimatedStyle(() => ({
            height: barH.value * 56,
          }));

          const isToday = i === 6;

          return (
            <View key={bar.date} style={styles.barCol}>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    bar.completed === true && styles.barFillDone,
                    bar.completed === false && styles.barFillSkip,
                    bar.completed === null && styles.barFillEmpty,
                    barStyle,
                  ]}
                />
              </View>
              <Text style={[styles.barDay, isToday && styles.barDayToday]}>{bar.day}</Text>
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// Hero insight card with gradient-like layered background
function InsightCard({ insight }: { insight: WeeklyInsightResult }) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(180)} style={styles.heroCard}>
      {/* Soft green orb behind content */}
      <View style={styles.heroOrb} />

      <View style={styles.heroInner}>
        <View style={styles.heroEyebrowRow}>
          <View style={styles.heroEyebrowDot} />
          <Text style={styles.heroEyebrow}>AI Weekly Summary</Text>
        </View>

        <Text style={styles.heroSummary}>{insight.summary}</Text>
      </View>
    </Animated.View>
  );
}

// Suggestion card
function SuggestionCard({ insight }: { insight: WeeklyInsightResult }) {
  return (
    <Animated.View entering={FadeInDown.duration(480).delay(300)} style={styles.suggCard}>
      <View style={styles.suggHeader}>
        <Text style={styles.suggIcon}>✦</Text>
        <Text style={styles.suggEyebrow}>Tomorrow's focus</Text>
      </View>
      <Text style={styles.suggText}>{insight.insight}</Text>
    </Animated.View>
  );
}

// Pulsing loading state
function LoadingCard() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withDelay(
      0,
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
    );
    const interval = setInterval(() => {
      opacity.value = opacity.value > 0.7
        ? withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) })
        : withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const s = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.loadingCard, s]}>
      <View style={[styles.skelLine, { width: '60%', height: 10, marginBottom: 14 }]} />
      <View style={[styles.skelLine, { width: '95%', height: 15 }]} />
      <View style={[styles.skelLine, { width: '80%', height: 15, marginTop: 8 }]} />
      <View style={[styles.skelLine, { width: '70%', height: 15, marginTop: 8 }]} />
      <View style={[styles.skelLine, { width: '50%', height: 12, marginTop: 20 }]} />
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const { data: habits = [] } = useHabits();
  const {
    mutate: fetchInsightMutate,
    data: insight,
    isPending: loading,
    error: insightError,
  } = useWeeklyInsight();

  const error = (insightError as Error)?.message ?? '';

  const weekHabits = habits.slice(0, 7);
  const completed = weekHabits.filter((h) => h.completed).length;
  const rate = weekHabits.length > 0 ? completed / weekHabits.length : 0;
  const bars = buildWeekBars(habits.slice(0, 14));

  const fetchInsight = useCallback(() => {
    const week = habits.slice(0, 7).map((h) => ({ habit: h.habit, completed: h.completed }));
    fetchInsightMutate(week);
  }, [habits, fetchInsightMutate]);

  useEffect(() => { fetchInsight(); }, []);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(360)} style={styles.header}>
          <View style={styles.wordmarkRow}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>atomy</Text>
          </View>
          <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>Insights</Text>
            <Text style={styles.pageSubtitle}>Your week in review</Text>
          </Animated.View>
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.View entering={FadeIn.duration(280)} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {/* Progress ring — always shown if we have data */}
        {habits.length > 0 && (
          <Animated.View entering={FadeIn.duration(500).delay(100)} style={styles.ringSection}>
            <ProgressRing rate={rate} total={weekHabits.length} completed={completed} />
          </Animated.View>
        )}

        {/* Week bars */}
        {habits.length > 0 && <WeekBars bars={bars} />}

        {/* AI content */}
        {loading ? (
          <View style={styles.loadingSection}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.loadingHeader}>
              <View style={styles.loadingDot} />
              <Text style={styles.loadingLabel}>Analysing your week…</Text>
            </Animated.View>
            <LoadingCard />
          </View>
        ) : insight ? (
          <View style={styles.cardsSection}>
            <InsightCard insight={insight} />
            <SuggestionCard insight={insight} />
          </View>
        ) : null}

        {/* Refresh */}
        {!loading && (
          <Animated.View entering={FadeIn.duration(380).delay(500)} style={btnStyle}>
            <Pressable
              onPress={fetchInsight}
              onPressIn={() => { btnScale.value = withSpring(0.97, { damping: 18, stiffness: 280 }); }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
              style={styles.refreshBtn}
            >
              <Text style={styles.refreshIcon}>⟳</Text>
              <Text style={styles.refreshText}>Refresh insight</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      <TabBar />
    </View>
  );
}

const BAR_WIDTH = Math.floor((width - 48 - 6 * 8) / 7);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  wordmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  wordmark: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: GREEN,
    textTransform: 'uppercase',
  },
  pageTitleRow: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: INK,
    letterSpacing: -1.2,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: MUTED,
    letterSpacing: 0.1,
  },

  // Error
  errorBanner: {
    marginHorizontal: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },

  // Ring section
  ringSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  ringWrap: {
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  ringTrack: {
    borderColor: GREEN_LIGHT,
    position: 'absolute',
  },
  ringFill: {
    borderColor: GREEN,
    position: 'absolute',
    borderTopColor: GREEN,
    borderRightColor: GREEN,
    borderBottomColor: GREEN_LIGHT,
    borderLeftColor: GREEN_LIGHT,
  },
  ringCenter: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringPct: {
    fontSize: 44,
    fontWeight: '700',
    color: INK,
    letterSpacing: -2,
    lineHeight: 50,
  },
  ringPctSign: {
    fontSize: 22,
    fontWeight: '400',
    color: MUTED,
  },
  ringLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  ringStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  ringStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 2,
  },
  ringStatNum: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.5,
  },
  ringStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ringStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: BORDER,
  },

  // Bar chart
  barsCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  barsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 80,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barTrack: {
    width: '100%',
    height: 56,
    backgroundColor: SOFT,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barFillDone: {
    backgroundColor: GREEN,
  },
  barFillSkip: {
    backgroundColor: '#FCA5A5',
  },
  barFillEmpty: {
    backgroundColor: BORDER,
  },
  barDay: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.3,
  },
  barDayToday: {
    color: GREEN,
  },
  todayDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: GREEN,
    position: 'absolute',
    bottom: -1,
  },

  // AI cards
  cardsSection: {
    paddingHorizontal: 24,
    gap: 14,
    marginBottom: 24,
  },

  // Hero insight card
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: GREEN_PALE,
    borderWidth: 1,
    borderColor: GREEN_LIGHT,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  heroOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: GREEN_LIGHT,
    opacity: 0.6,
  },
  heroInner: {
    padding: 22,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  heroEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#166534',
    textTransform: 'uppercase',
  },
  heroSummary: {
    fontSize: 15,
    fontWeight: '400',
    color: '#14532D',
    lineHeight: 24,
  },

  // Suggestion card
  suggCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  suggHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggIcon: {
    fontSize: 13,
    color: GREEN,
  },
  suggEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: MUTED,
    textTransform: 'uppercase',
  },
  suggText: {
    fontSize: 15,
    fontWeight: '400',
    color: INK,
    lineHeight: 24,
  },

  // Loading
  loadingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 14,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  loadingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.2,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skelLine: {
    backgroundColor: BORDER,
    borderRadius: 6,
    width: '100%',
    height: 12,
  },

  // Refresh
  refreshBtn: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  refreshIcon: {
    fontSize: 16,
    color: MUTED,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.3,
  },
});
