import { useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
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
import { useRouter } from 'expo-router';
import { type HabitRow } from '../../services/habits';
import TabScreen from '@/components/TabScreen';
import { HeatmapStrip } from '@/components/HeatMap';
import { useHabits } from '../../hooks/useHabits';
import colors from '../../constants/colors';
import { formatSectionDate, formatTime, groupByDate } from '@/utils/time';

function HabitCard({ item, index }: { item: HabitRow; index: number }) {
  const router = useRouter();
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(Math.min(index * 60, 300))}
    >
      <Pressable
        onPress={() => router.push(`/habit/${item.id}`)}
        style={[styles.card, item.completed ? styles.cardDone : styles.cardSkip]}
      >
        {/* Status icon */}
        <View style={[styles.statusIcon, item.completed ? styles.statusIconDone : styles.statusIconSkip]}>
          <Text style={[styles.statusIconText, item.completed ? styles.statusIconTextDone : styles.statusIconTextSkip]}>
            {item.completed ? '✓' : '–'}
          </Text>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.habitText} numberOfLines={2}>{item.habit}</Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

// Section header
function SectionHeader({ title }: { title: string }) {
  const { label, sub } = formatSectionDate(title);
  return (
    <Animated.View entering={FadeIn.duration(380)} style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionSub}>{sub}</Text>
    </Animated.View>
  );
}

// Loading skeleton
function SkeletonCard() {
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
    <TabScreen statusBarColor={colors.background}>
      {loading ? (
        <View style={styles.loadingRoot}>
          {/* Header skeleton */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>History</Text>
          </View>
          <View style={{ paddingHorizontal: 24, gap: 14 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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
          renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
          renderItem={({ item, index }) => <HabitCard item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
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
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.2,
  },
  totalBadge: {
    backgroundColor: colors.soft,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.3,
  },

  // Error
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
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
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
  },

  // Habit card
  card: {
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    gap: 12,
  },
  cardDone: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  cardSkip: {
    backgroundColor: colors.skipBg,
    borderColor: colors.skipBorder,
  },

  // Status icon circle
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusIconDone: {
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  statusIconSkip: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: colors.skipBorder,
  },
  statusIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusIconTextDone: {
    color: colors.primary,
  },
  statusIconTextSkip: {
    color: colors.skipText,
  },

  // Card body
  cardBody: {
    flex: 1,
    gap: 3,
  },
  habitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.2,
  },
  chevron: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '300',
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
    color: colors.border,
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    width: '100%',
  },
});
