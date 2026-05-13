import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabScreen from '@/components/TabScreen';
import { type HabitCheckin } from '../../services/habits';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import colors from '../../constants/colors';
import { getCompletionRate } from '@/utils/habit-stats';
import { formatTime, groupByDate } from '@/utils/date';

const DONE = colors.primary;
const SKIPPED = '#FF3B30';
const EMPTY = '#E5E5EA';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function dateKey(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

function buildCells(history: HabitCheckin[], days: number) {
  const byDate = new Map<string, boolean>();
  history.forEach((entry) => {
    const key = entry.checkin_date || entry.created_at.slice(0, 10);
    const prior = byDate.get(key);
    byDate.set(key, prior === true || entry.completed);
  });

  return Array.from({ length: days }, (_, offset) => {
    const key = dateKey(offset);
    return { key, completed: byDate.has(key) ? byDate.get(key)! : null };
  });
}

function ActivityCard({ history }: { history: HabitCheckin[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const cells = buildCells(history, 14).reverse();
  const completedDays = cells.filter((cell) => cell.completed === true).length;
  const trackedDays = cells.filter((cell) => cell.completed !== null).length;

  return (
    <Card>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>14-day Activity</Text>
        <Text style={styles.percent}>{getCompletionRate(completedDays, trackedDays)}%</Text>
      </View>
      <Text style={styles.subtitle}>{completedDays} of {trackedDays} days completed</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activityDots}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {cells.map((cell) => (
          <View
            key={cell.key}
            style={[
              styles.activityDot,
              cell.completed === true && styles.activityDotDone,
              cell.completed === false && styles.activityDotSkipped,
            ]}
          />
        ))}
      </ScrollView>
      <View style={styles.legend}>
        <Legend color={DONE} label="Done" />
        <Legend color={SKIPPED} label="Skipped" />
        <Legend color={EMPTY} label="No habit" />
      </View>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function formatHeader(key: string) {
  const date = new Date(`${key}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const label =
    date.getTime() === today.getTime()
      ? 'Today'
      : date.getTime() === yesterday.getTime()
        ? 'Yesterday'
        : date.toLocaleDateString('en-US', { weekday: 'long' });
  return { label, date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };
}

function HistoryRow({ entry, isLast }: { entry: HabitCheckin; isLast: boolean }) {
  return (
    <View>
      <View style={styles.entryRow}>
        <View style={[styles.entryIcon, entry.completed ? styles.entryIconDone : styles.entryIconSkipped]}>
          <Text style={[styles.entryIconText, !entry.completed && styles.entryIconTextSkipped]}>
            {entry.completed ? '✓' : '−'}
          </Text>
        </View>
        <View style={styles.entryCopy}>
          <Text style={styles.entryName} numberOfLines={2}>{entry.habit}</Text>
          <Text style={styles.entryTime}>{formatTime(entry.created_at)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

function Overview({ history }: { history: HabitCheckin[] }) {
  const cells = buildCells(history, 7).reverse();
  const todayKey = dateKey(0);
  return (
    <View style={styles.overview}>
      <Text style={styles.overviewTitle}>7-DAY OVERVIEW</Text>
      <View style={styles.overviewRow}>
        {cells.map((cell, index) => (
          <View key={cell.key} style={[styles.dayChip, cell.key === todayKey && styles.dayChipToday]}>
            <Text style={styles.dayInitial}>{WEEKDAYS[index]}</Text>
            <View
              style={[
                styles.dayDot,
                cell.completed === true && styles.dayDotDone,
                cell.completed === false && styles.dayDotSkipped,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: history = [] } = useHabitHistory();
  const sections = useMemo(() => groupByDate(history), [history]);

  return (
    <TabScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Pressable style={styles.filterButton}>
            <View style={styles.funnelTop} />
            <View style={styles.funnelStem} />
          </Pressable>
        </View>

        <ActivityCard history={history} />

        {sections.map((section) => {
          const header = formatHeader(section.title);
          return (
            <View key={section.title} style={styles.group}>
              <Text style={styles.groupHeader}>
                <Text style={styles.groupHeaderStrong}>{header.label}</Text>
                <Text style={styles.groupHeaderMuted}> · {header.date}</Text>
              </Text>
              <Card style={styles.groupCard}>
                {section.data.map((entry, index) => (
                  <HistoryRow key={entry.id} entry={entry} isLast={index === section.data.length - 1} />
                ))}
              </Card>
            </View>
          );
        })}

        <Overview history={history} />
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
  filterButton: {
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
  funnelTop: {
    width: 17,
    height: 7,
    borderTopWidth: 8,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopColor: colors.muted,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  funnelStem: {
    width: 4,
    height: 9,
    backgroundColor: colors.muted,
    marginTop: -1,
    borderRadius: 2,
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  percent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
  },
  activityDots: {
    gap: 5,
    paddingTop: 22,
    paddingBottom: 18,
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: EMPTY,
  },
  activityDotDone: {
    backgroundColor: DONE,
  },
  activityDotSkipped: {
    backgroundColor: SKIPPED,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: colors.muted,
  },
  group: {
    gap: 12,
  },
  groupHeader: {
    fontSize: 15,
  },
  groupHeaderStrong: {
    fontWeight: '700',
    color: colors.text,
  },
  groupHeaderMuted: {
    color: colors.muted,
  },
  groupCard: {
    paddingVertical: 8,
  },
  entryRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIconDone: {
    backgroundColor: colors.primary,
  },
  entryIconSkipped: {
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  entryIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  entryIconTextSkipped: {
    color: SKIPPED,
  },
  entryCopy: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  entryTime: {
    marginTop: 5,
    fontSize: 12,
    color: colors.muted,
  },
  chevron: {
    fontSize: 30,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 54,
  },
  overview: {
    gap: 12,
  },
  overviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.5,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 44,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayChipToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayInitial: {
    fontSize: 11,
    color: colors.muted,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EMPTY,
  },
  dayDotDone: {
    backgroundColor: DONE,
  },
  dayDotSkipped: {
    backgroundColor: SKIPPED,
  },
});
