import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { type HabitCheckin } from '../../services/habits';
import TabScreen from '@/components/TabScreen';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import colors from '../../constants/colors';
import { getCompletionRate } from '@/utils/habit-stats';
import { formatDateLong, formatTime, groupByDate } from '@/utils/date';

const DAYS = 14;
const DONE = colors.primary;
const SKIPPED = '#FF3B30';
const EMPTY = '#EBEBEB';

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getShortDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function buildActivityCells(habits: HabitCheckin[]) {
  const byDate = new Map<string, boolean>();

  for (const habit of habits) {
    const dateKey = habit.checkin_date || habit.created_at.slice(0, 10);
    if (!byDate.has(dateKey)) byDate.set(dateKey, habit.completed);
    if (habit.completed) byDate.set(dateKey, true);
  }

  return Array.from({ length: DAYS }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const dateKey = getLocalDateKey(date);
    return {
      dateKey,
      completed: byDate.has(dateKey) ? byDate.get(dateKey)! : null,
    };
  });
}

function formatGroupHeader(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return `Today · ${getShortDate(dateKey)}`;
  if (date.getTime() === yesterday.getTime()) return `Yesterday · ${getShortDate(dateKey)}`;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function Card({ children, style }: { children?: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function ActivityCard({ habits }: { habits: HabitCheckin[] }) {
  const dotScrollRef = useRef<ScrollView>(null);
  const cells = buildActivityCells(habits).reverse();
  const completedDays = cells.filter((cell) => cell.completed === true).length;
  const trackedDays = cells.filter((cell) => cell.completed !== null).length;
  const rate = getCompletionRate(completedDays, trackedDays);

  return (
    <Card>
      <View style={styles.activityTopRow}>
        <Text style={styles.cardTitle}>14-day activity</Text>
        <View style={styles.percentPill}>
          <Text style={styles.percentText}>{rate}%</Text>
        </View>
      </View>

      <Text style={styles.activitySub}>
        {completedDays} of {trackedDays} days completed
      </Text>

      <View style={styles.dotScrollerWrap}>
        <ScrollView
          ref={dotScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dotGrid}
          onContentSizeChange={() => dotScrollRef.current?.scrollToEnd({ animated: false })}
        >
          {cells.map((cell) => (
            <View
              key={cell.dateKey}
              style={[
                styles.activityDot,
                cell.completed === true && styles.activityDotDone,
                cell.completed === false && styles.activityDotSkipped,
              ]}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <LegendItem color={DONE} label="Done" />
        <LegendItem color={SKIPPED} label="Skipped" />
        <LegendItem color={EMPTY} label="No habit" />
      </View>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SevenDayOverview({ habits }: { habits: HabitCheckin[] }) {
  const cells = buildActivityCells(habits).slice(0, 7).reverse();

  return (
    <View style={styles.timeline}>
      <Text style={styles.timelineLabel}>7-DAY OVERVIEW</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineRow}>
        {cells.map((cell) => {
          const date = new Date(`${cell.dateKey}T00:00:00`);
          return (
            <View key={cell.dateKey} style={styles.dayChip}>
              <Text style={styles.dayChipText}>{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</Text>
              <View
                style={[
                  styles.dayChipDot,
                  cell.completed === true && styles.dayChipDotDone,
                  cell.completed === false && styles.dayChipDotSkipped,
                ]}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function HistoryRow({
  item,
  isLast,
  onPress,
}: {
  item: HabitCheckin;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable onPress={onPress} style={styles.entryRow}>
        <View style={[styles.statusCircle, item.completed ? styles.statusDone : styles.statusSkipped]}>
          <Text style={[styles.statusIcon, !item.completed && styles.statusIconSkipped]}>
            {item.completed ? '✓' : '−'}
          </Text>
        </View>

        <View style={styles.entryText}>
          <Text style={styles.entryName} numberOfLines={1}>
            {item.habit}
          </Text>
          <Text style={styles.entryTime}>{formatTime(item.created_at)}</Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

function EmptyHistory() {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.calendarIcon}>
        <View style={styles.calendarTop} />
        <View style={styles.calendarLine} />
        <View style={[styles.calendarLine, styles.calendarLineShort]} />
      </View>
      <Text style={styles.emptyTitle}>No history yet</Text>
      <Text style={styles.emptyText}>Complete your first habit to start tracking</Text>
    </Card>
  );
}

function DetailSheet({ item, onClose }: { item: HabitCheckin | null; onClose: () => void }) {
  return (
    <Modal transparent visible={Boolean(item)} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={2}>
              {item?.habit}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>

          {item ? (
            <>
              <Text style={styles.sheetDate}>{formatDateLong(item.created_at)}</Text>
              <View style={[styles.statusPill, item.completed ? styles.statusPillDone : styles.statusPillSkipped]}>
                <Text style={[styles.statusPillText, item.completed ? styles.statusPillTextDone : styles.statusPillTextSkipped]}>
                  {item.completed ? 'Completed' : 'Skipped'}
                </Text>
              </View>
              {item.goal ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{item.goal}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HistoryScreen() {
  const { data: habits = [], isLoading: loading, error: queryError } = useHabitHistory();
  const [selected, setSelected] = useState<HabitCheckin | null>(null);
  const sections = useMemo(() => groupByDate(habits), [habits]);
  const error = (queryError as Error)?.message ?? '';

  return (
    <TabScreen statusBarColor={colors.background}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>History</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <>
            <Card style={styles.skeletonCard} />
            <Card style={styles.skeletonCardSmall} />
          </>
        ) : habits.length === 0 && !error ? (
          <EmptyHistory />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(320)}>
              <ActivityCard habits={habits} />
            </Animated.View>

            <View style={styles.groups}>
              {sections.map((section) => (
                <View key={section.title} style={styles.group}>
                  <Text style={styles.groupHeader}>{formatGroupHeader(section.title)}</Text>
                  <Card style={styles.groupCard}>
                    {section.data.length === 0 ? (
                      <Text style={styles.emptyGroupText}>No activity recorded</Text>
                    ) : (
                      section.data.map((item, index) => (
                        <HistoryRow
                          key={item.id}
                          item={item}
                          isLast={index === section.data.length - 1}
                          onPress={() => setSelected(item)}
                        />
                      ))
                    )}
                  </Card>
                </View>
              ))}
            </View>

            <Animated.View entering={FadeInDown.duration(320).delay(80)}>
              <SevenDayOverview habits={habits} />
            </Animated.View>
          </>
        )}
      </ScrollView>
      <DetailSheet item={selected} onClose={() => setSelected(null)} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
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
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  percentPill: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  activitySub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  dotScrollerWrap: {
    marginTop: 18,
    position: 'relative',
  },
  dotGrid: {
    gap: 5,
    paddingRight: 2,
  },
  activityDot: {
    width: 26,
    height: 26,
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
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.muted,
  },
  groups: {
    gap: 16,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  groupCard: {
    paddingVertical: 4,
  },
  emptyGroupText: {
    paddingVertical: 18,
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
  },
  entryRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDone: {
    backgroundColor: colors.primary,
  },
  statusSkipped: {
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  statusIcon: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  statusIconSkipped: {
    color: SKIPPED,
  },
  entryText: {
    flex: 1,
    gap: 2,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  entryTime: {
    fontSize: 12,
    color: colors.muted,
  },
  chevron: {
    fontSize: 24,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 48,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  calendarIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(52,199,89,0.45)',
    marginBottom: 16,
    padding: 12,
  },
  calendarTop: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(52,199,89,0.45)',
    marginBottom: 12,
  },
  calendarLine: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(52,199,89,0.28)',
    marginBottom: 7,
  },
  calendarLineShort: {
    width: '65%',
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
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  skeletonCard: {
    height: 170,
    backgroundColor: '#F9F9F9',
  },
  skeletonCardSmall: {
    height: 120,
    backgroundColor: '#F9F9F9',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D8D8D8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.muted,
  },
  sheetDate: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillDone: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  statusPillSkipped: {
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPillTextDone: {
    color: colors.primary,
  },
  statusPillTextSkipped: {
    color: SKIPPED,
  },
  notesBox: {
    marginTop: 18,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  timeline: {
    gap: 10,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 1.1,
  },
  timelineRow: {
    gap: 10,
    paddingRight: 20,
  },
  dayChip: {
    width: 40,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayChipText: {
    fontSize: 11,
    color: colors.muted,
  },
  dayChipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: EMPTY,
  },
  dayChipDotDone: {
    backgroundColor: DONE,
  },
  dayChipDotSkipped: {
    backgroundColor: SKIPPED,
  },
});
