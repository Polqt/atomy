import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { type HabitRow } from '@/services/habits';
import { buildRecentDaySummary, getCompletionRate } from '@/utils/habit-stats';

const { width } = Dimensions.get('window');
const DAYS = 14;
const CELL_SIZE = Math.floor((width - 48 - (DAYS - 1) * 6) / DAYS);

export function HeatmapStrip({ habits }: { habits: HabitRow[] }) {
  const cells = buildRecentDaySummary(habits, DAYS);
  const completedCount = cells.filter((cell) => cell.completed === true).length;
  const trackedCount = cells.filter((cell) => cell.completed !== null).length;
  const rate = getCompletionRate(completedCount, trackedCount);

  return (
    <Animated.View entering={FadeInDown.duration(440).delay(200)} style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>14-day activity</Text>
          <Text style={styles.sub}>
            {completedCount} of {trackedCount} days completed
          </Text>
        </View>
        <View style={styles.ratePill}>
          <Text style={styles.rateText}>{rate}%</Text>
        </View>
      </View>

      <View style={styles.cells}>
        {cells.map((cell) => (
          <View
            key={cell.dateKey}
            style={[
              styles.cell,
              cell.completed === true && styles.cellDone,
              cell.completed === false && styles.cellSkipped,
              cell.completed === null && styles.cellEmpty,
            ]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Done" />
        <LegendItem color={SKIP_TEXT} label="Skipped" />
        <LegendItem color={colors.border} label="No habit" />
      </View>
    </Animated.View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const SKIP_TEXT = '#EF4444';

const styles = StyleSheet.create({
  card: {
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
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.muted,
  },
  ratePill: {
    backgroundColor: colors.primaryPale,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cells: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
  },
  cellDone: {
    backgroundColor: colors.primary,
  },
  cellSkipped: {
    backgroundColor: '#FCA5A5',
  },
  cellEmpty: {
    backgroundColor: colors.border,
  },
  legend: {
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
    color: colors.muted,
    letterSpacing: 0.3,
  },
});

