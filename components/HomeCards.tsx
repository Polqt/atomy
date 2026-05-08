import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { type TodayHabit } from '../services/habits';
import colors from '../constants/colors';
import { getDayProgress } from '@/utils/user';

export function DayProgressArc({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <View style={styles.arcWrap}>
      <View style={styles.arcTrack}>
        <View style={[styles.arcFill, { height: `${pct}%` }]} />
      </View>
      <Text style={styles.arcPct}>{pct}%</Text>
    </View>
  );
}

export function HabitCard({
  habit,
  onDone,
  onSkip,
  acting,
}: {
  habit: TodayHabit;
  onDone: () => void;
  onSkip: () => void;
  acting: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(480).delay(180)} style={styles.habitCard}>
      <View style={styles.accentBar} />

      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>Today's Habit</Text>
          <Text style={styles.cardDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <DayProgressArc progress={getDayProgress()} />
      </View>

      <Text style={styles.habitText}>{habit.habit}</Text>

      <View style={styles.reasonBlock}>
        <Text style={styles.reasonEyebrow}>Why this matters</Text>
        <Text style={styles.reasonText}>{habit.goal}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={acting ? undefined : onDone}
          style={[styles.doneButton, acting && { opacity: 0.5 }]}
        >
          {acting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.doneIcon}>✓</Text>
              <Text style={styles.doneText}>Done for today</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={acting ? undefined : onSkip}
          style={[styles.skipLink, acting && { opacity: 0.5 }]}
        >
          <Text style={styles.skipText}>Open details</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function HabitListItem({
  habit,
  onDone,
  acting,
}: {
  habit: TodayHabit;
  onDone: () => void;
  acting: boolean;
}) {
  const router = useRouter();
  return (
    <View style={styles.listItem}>
      <Pressable
        style={styles.listItemContent}
        onPress={() => router.push(`/habit/${habit.id}`)}
      >
        <View style={styles.listItemBody}>
          <Text style={styles.listItemHabit} numberOfLines={2}>{habit.habit}</Text>
          {habit.goal ? (
            <Text style={styles.listItemGoal} numberOfLines={1}>{habit.goal}</Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={habit.completed ? undefined : onDone}
        disabled={acting}
        style={[
          styles.checkBtn,
          habit.completed && styles.checkBtnDone,
          acting && { opacity: 0.5 },
        ]}
      >
        {acting ? (
          <ActivityIndicator color={habit.completed ? '#fff' : colors.muted} size="small" />
        ) : (
          <Text style={[styles.checkIcon, habit.completed && styles.checkIconDone]}>✓</Text>
        )}
      </Pressable>
    </View>
  );
}

export function DoneCard({ habit, onEditGoal }: { habit: TodayHabit; onEditGoal: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(480).delay(120)} style={styles.stateCard}>
      <View style={styles.stateIconWrap}>
        <Text style={styles.stateIcon}>✓</Text>
      </View>
      <Text style={styles.stateHeading}>Habit complete!</Text>
      <Text style={styles.stateHabitText}>{habit.habit}</Text>
      <Text style={styles.stateSub}>You're building momentum. Come back tomorrow.</Text>
      <Pressable onPress={onEditGoal} style={styles.editGoalBtn}>
        <Text style={styles.editGoalText}>Edit goal →</Text>
      </Pressable>
    </Animated.View>
  );
}

export function EmptyCard({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(480).delay(180)} style={styles.emptyCard}>
      <View style={styles.emptyCenter}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyPlusIcon}>+</Text>
        </View>

        <Text style={styles.emptyHeading}>No habits yet</Text>
        <Text style={styles.emptySub}>Start small. Build your first habit today.</Text>
      </View>

      <Pressable onPress={onGenerate} style={styles.generateBtn}>
        <Text style={styles.generateBtnText}>Create your first habit</Text>
      </Pressable>
    </Animated.View>
  );
}

export function LoadingSkeleton() {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.skeleton}>
      <Animated.View style={[styles.skeletonCard, pulseStyle]}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 10 }]} />
        <View style={[styles.skeletonLine, { width: '90%', height: 60, marginTop: 24, borderRadius: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 20 }]} />
        <View style={styles.skeletonButtons}>
          <View style={[styles.skeletonLine, { flex: 2, height: 48, borderRadius: 12 }]} />
          <View style={[styles.skeletonLine, { flex: 1, height: 48, borderRadius: 12 }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Arc
  arcWrap: {
    alignItems: 'center',
    gap: 3,
  },
  arcTrack: {
    width: 28,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    transform: [{ rotate: '-90deg' }],
  },
  arcFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  arcPct: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.5,
  },

  // Big habit card (single-habit detail view)
  habitCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingLeft: 4,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.2,
  },
  habitText: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 30,
    paddingLeft: 4,
    marginBottom: 20,
  },
  reasonBlock: {
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  reasonEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 19,
  },
  actions: {
    gap: 12,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  doneIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.2,
  },

  // Compact list item (multi-habit home screen)
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  listItemContent: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
  },
  listItemBody: {
    gap: 3,
  },
  listItemHabit: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 21,
  },
  listItemGoal: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 17,
  },
  checkBtn: {
    width: 44,
    height: 44,
    margin: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
  },
  checkIconDone: {
    color: '#fff',
  },

  // Done / state card
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 5,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryPale,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  stateHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  stateHabitText: {
    fontSize: 15,
    fontWeight: '300',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  stateSub: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  editGoalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.soft,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editGoalText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    letterSpacing: 0.3,
  },

  // Empty card
  emptyCard: {
    width: '100%',
  },
  emptyCenter: {
    marginTop: 120,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyPlusIcon: {
    fontSize: 32,
    color: '#22C55E',
    fontWeight: '300',
    lineHeight: 36,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    width: 260,
    lineHeight: 20,
  },
  generateBtn: {
    marginTop: 48,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Skeleton
  skeleton: {
    width: '100%',
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 7,
    width: '100%',
  },
  skeletonButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
