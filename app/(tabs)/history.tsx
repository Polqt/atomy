import { useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { type HabitRow } from '../../services/habits';
import TabBar from '../../components/TabBar';
import { useHabits } from '../../hooks/useHabits';

const { width } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_PALE = '#F0FDF4';
const GREEN_LIGHT = '#DCFCE7';
const CREAM = '#FAFAF8';
const INK = '#0A0A0A';
const MUTED = '#9CA3AF';
const SOFT = '#F9FAFB';
const BORDER = '#F3F4F6';
const SKIP_BG = '#FFF7F7';
const SKIP_BORDER = '#FFE4E1';
const SKIP_TEXT = '#EF4444';

// Group habits by calendar date, sorted newest first
type Section = {
  title: string; // YYYY-MM-DD
  data: HabitRow[];
};

function groupByDate(habits: HabitRow[]): Section[] {
  const map = new Map<string, HabitRow[]>();
  for (const h of habits) {
    const day = h.created_at.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(h);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([title, data]) => ({ title, data }));
}

function formatSectionDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return { label: 'Today', sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };
  if (target.getTime() === yesterday.getTime()) return { label: 'Yesterday', sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };

  return {
    label: d.toLocaleDateString('en-US', { weekday: 'long' }),
    sub: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// 14-day heatmap strip
function HeatmapStrip({ habits }: { habits: HabitRow[] }) {
  const days = 14;
  const cells: { date: string; completed: boolean | null }[] = [];

  const byDate = new Map<string, boolean>();
  for (const h of habits) {
    const day = h.created_at.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, h.completed);
    else if (h.completed) byDate.set(day, true);
  }

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({
      date: key,
      completed: byDate.has(key) ? byDate.get(key)! : null,
    });
  }

  const completedCount = cells.filter((c) => c.completed === true).length;
  const trackedCount = cells.filter((c) => c.completed !== null).length;
  const rate = trackedCount > 0 ? Math.round((completedCount / trackedCount) * 100) : 0;

  return (
    <Animated.View entering={FadeInDown.duration(440).delay(200)} style={styles.heatmapCard}>
      <View style={styles.heatmapHeader}>
        <View>
          <Text style={styles.heatmapTitle}>14-day activity</Text>
          <Text style={styles.heatmapSub}>
            {completedCount} of {trackedCount} days completed
          </Text>
        </View>
        <View style={styles.ratePill}>
          <Text style={styles.rateText}>{rate}%</Text>
        </View>
      </View>
      <View style={styles.heatmapCells}>
        {cells.map((cell, i) => (
          <View
            key={cell.date}
            style={[
              styles.heatCell,
              cell.completed === true && styles.heatCellDone,
              cell.completed === false && styles.heatCellSkip,
              cell.completed === null && styles.heatCellEmpty,
            ]}
          />
        ))}
      </View>
      <View style={styles.heatmapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
          <Text style={styles.legendLabel}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SKIP_TEXT }]} />
          <Text style={styles.legendLabel}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BORDER }]} />
          <Text style={styles.legendLabel}>No habit</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Individual habit card
function HabitCard({ item, index }: { item: HabitRow; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(Math.min(index * 60, 300))}
      style={[styles.card, item.completed ? styles.cardDone : styles.cardSkip]}
    >
      {/* Left timeline thread */}
      <View style={styles.threadCol}>
        <View style={[styles.threadDot, item.completed ? styles.threadDotDone : styles.threadDotSkip]} />
        <View style={styles.threadLine} />
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        {/* Status badge */}
        <View style={[styles.statusBadge, item.completed ? styles.badgeDone : styles.badgeSkip]}>
          <View style={[styles.badgeDot, item.completed ? styles.badgeDotDone : styles.badgeDotSkip]} />
          <Text style={[styles.badgeText, item.completed ? styles.badgeTextDone : styles.badgeTextSkip]}>
            {item.completed ? 'Completed' : 'Skipped'}
          </Text>
        </View>

        {/* Habit text */}
        <Text style={styles.habitText}>{item.habit}</Text>

        {/* Time */}
        <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
      </View>
    </Animated.View>
  );
}

// Section header
function SectionHeader({ title, index }: { title: string; index: number }) {
  const { label, sub } = formatSectionDate(title);
  return (
    <Animated.View
      entering={FadeIn.duration(380).delay(Math.min(index * 80, 240))}
      style={styles.sectionHeader}
    >
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionSub}>{sub}</Text>
    </Animated.View>
  );
}

// Loading skeleton
function SkeletonCard({ delay }: { delay: number }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const s = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.skeletonCard, s]}>
      <View style={[styles.skeletonLine, { width: '35%', height: 10, marginBottom: 12 }]} />
      <View style={[styles.skeletonLine, { width: '90%', height: 14 }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 14, marginTop: 6 }]} />
      <View style={[styles.skeletonLine, { width: '25%', height: 10, marginTop: 12 }]} />
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { data: habits = [], isLoading: loading, error: queryError } = useHabits();
  const error = (queryError as Error)?.message ?? '';

  const sections = groupByDate(habits);
  const totalCompleted = habits.filter((h) => h.completed).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      {loading ? (
        <View style={styles.loadingRoot}>
          {/* Header skeleton */}
          <View style={styles.headerBlock}>
            <View style={styles.wordmarkRow}>
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmark}>atomy</Text>
            </View>
            <Text style={styles.pageTitle}>History</Text>
          </View>
          <View style={{ paddingHorizontal: 24, gap: 14 }}>
            <SkeletonCard delay={0} />
            <SkeletonCard delay={120} />
            <SkeletonCard delay={240} />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Animated.View entering={FadeIn.duration(360)} style={styles.wordmarkRow}>
                <View style={styles.wordmarkDot} />
                <Text style={styles.wordmark}>atomy</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.pageTitleRow}>
                <Text style={styles.pageTitle}>History</Text>
                {habits.length > 0 && (
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalText}>{totalCompleted}/{habits.length}</Text>
                  </View>
                )}
              </Animated.View>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {habits.length > 0 && <HeatmapStrip habits={habits} />}
            </View>
          }
          ListEmptyComponent={
            !error ? (
              <Animated.View entering={FadeInDown.duration(480).delay(200)} style={styles.emptyBlock}>
                <Text style={styles.emptyIcon}>○</Text>
                <Text style={styles.emptyHeading}>No habits yet</Text>
                <Text style={styles.emptySub}>Your completed habits will appear here as a journal of your progress.</Text>
              </Animated.View>
            ) : null
          }
          renderSectionHeader={({ section }) => {
            const idx = sections.findIndex((s) => s.title === section.title);
            return <SectionHeader title={section.title} index={idx === -1 ? 0 : idx} />;
          }}
          renderItem={({ item, index }) => <HabitCard item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <TabBar />
    </View>
  );
}

const CELL_SIZE = Math.floor((width - 48 - 13 * 6) / 14);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: CREAM,
  },
  listContent: {
    paddingBottom: 32,
  },

  // Header
  headerBlock: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 8,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: INK,
    letterSpacing: -1.2,
  },
  totalBadge: {
    backgroundColor: SOFT,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 4,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.3,
  },

  // Error
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },

  // Heatmap
  heatmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heatmapTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  heatmapSub: {
    fontSize: 11,
    fontWeight: '400',
    color: MUTED,
  },
  ratePill: {
    backgroundColor: GREEN_PALE,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: GREEN_LIGHT,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
  },
  heatmapCells: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  heatCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
  },
  heatCellDone: {
    backgroundColor: GREEN,
  },
  heatCellSkip: {
    backgroundColor: '#FCA5A5',
  },
  heatCellEmpty: {
    backgroundColor: BORDER,
  },
  heatmapLegend: {
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.3,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '400',
    color: MUTED,
  },

  // Habit card
  card: {
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
  },
  cardDone: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
  },
  cardSkip: {
    backgroundColor: SKIP_BG,
    borderColor: SKIP_BORDER,
  },

  // Timeline thread
  threadCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
  },
  threadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  threadDotDone: {
    backgroundColor: GREEN,
  },
  threadDotSkip: {
    backgroundColor: SKIP_TEXT,
    opacity: 0.5,
  },
  threadLine: {
    flex: 1,
    width: 1,
    backgroundColor: BORDER,
  },

  // Card body
  cardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  badgeDone: {
    backgroundColor: GREEN_PALE,
    borderWidth: 1,
    borderColor: GREEN_LIGHT,
  },
  badgeSkip: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: SKIP_BORDER,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  badgeDotDone: {
    backgroundColor: GREEN,
  },
  badgeDotSkip: {
    backgroundColor: SKIP_TEXT,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badgeTextDone: {
    color: '#166534',
  },
  badgeTextSkip: {
    color: SKIP_TEXT,
  },
  habitText: {
    fontSize: 14,
    fontWeight: '400',
    color: INK,
    lineHeight: 21,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
    color: MUTED,
    letterSpacing: 0.2,
  },

  // Empty
  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 32,
    color: BORDER,
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '400',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: BORDER,
    borderRadius: 6,
    width: '100%',
  },
});
