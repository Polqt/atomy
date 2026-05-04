import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { type TodayHabit } from '../../services/habits';
import { getGoal } from '../../services/goal';
import TabBar from '../../components/TabBar';
import { useAuth } from '../../context/AuthContext';
import { useTodayHabit } from '../../hooks/useTodayHabit';
import { useStreak } from '../../hooks/useStreak';
import { useMarkHabit } from '../../hooks/useMarkHabit';

const { width } = Dimensions.get('window');

const GREEN = '#22C55E';
const GREEN_PALE = '#F0FDF4';
const GREEN_LIGHT = '#DCFCE7';
const INK = '#0A0A0A';
const MUTED = '#9CA3AF';
const SOFT = '#F9FAFB';
const BORDER = '#F3F4F6';
const CREAM = '#FAFAF8';

type Status = 'idle' | 'done' | 'skipped';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDayProgress() {
  const now = new Date();
  return (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
}

// Animated streak flame badge
function StreakBadge({ count }: { count: number }) {
  const flameScale = useSharedValue(1);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.streakBadge}>
      <Animated.Text style={[styles.streakFlame, flameStyle]}>🔥</Animated.Text>
      <Text style={styles.streakCount}>{count}</Text>
      <Text style={styles.streakLabel}>{count === 1 ? 'day' : 'days'}</Text>
    </Animated.View>
  );
}

// Day progress arc (SVG-free, using border arc trick)
function DayProgressArc({ progress }: { progress: number }) {
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

// Habit card — the centrepiece
function HabitCard({
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
  const doneScale = useSharedValue(1);
  const skipScale = useSharedValue(1);

  return (
    <Animated.View entering={FadeInDown.duration(480).delay(180)} style={styles.habitCard}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      {/* Card header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>Today's Habit</Text>
          <Text style={styles.cardDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <DayProgressArc progress={getDayProgress()} />
      </View>

      {/* Habit text */}
      <Text style={styles.habitText}>{habit.habit}</Text>

      {/* Subtle divider + goal */}
      <View style={styles.reasonBlock}>
        <Text style={styles.reasonEyebrow}>Why this matters</Text>
        <Text style={styles.reasonText}>{habit.goal}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Done */}
        <Animated.View style={[styles.actionWrap, { flex: 2 }]}>
          <Pressable
            onPress={acting ? undefined : onDone}
            onPressIn={() => {
              if (!acting) doneScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
            }}
            onPressOut={() => {
              doneScale.value = withSpring(1, { damping: 14, stiffness: 220 });
            }}
            style={[styles.doneButton, acting && { opacity: 0.5 }]}
          >
            {acting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.doneIcon}>✓</Text>
                <Text style={styles.doneText}>Done</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Skip */}
        <Animated.View style={[styles.actionWrap, { flex: 1 }]}>
          <Pressable
            onPress={acting ? undefined : onSkip}
            onPressIn={() => {
              if (!acting) skipScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
            }}
            onPressOut={() => {
              skipScale.value = withSpring(1, { damping: 14, stiffness: 220 });
            }}
            style={[styles.skipButton, acting && { opacity: 0.5 }]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Completed state card
function DoneCard({ habit, onEditGoal }: { habit: TodayHabit; onEditGoal: () => void }) {
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

// Skipped state card
function SkippedCard({ habit, onEditGoal }: { habit: TodayHabit; onEditGoal: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(480).delay(120)} style={styles.stateCard}>
      <View style={[styles.stateIconWrap, styles.stateIconSkip]}>
        <Text style={styles.stateIconSkipText}>–</Text>
      </View>
      <Text style={styles.stateHeading}>Skipped today</Text>
      <Text style={styles.stateHabitText}>{habit.habit}</Text>
      <Text style={styles.stateSub}>Rest is part of the process. Try again tomorrow.</Text>
      <Pressable onPress={onEditGoal} style={styles.editGoalBtn}>
        <Text style={styles.editGoalText}>Edit goal →</Text>
      </Pressable>
    </Animated.View>
  );
}

// Empty state
function EmptyCard({ goal, onGenerate, onEditGoal }: {
  goal: string | null;
  onGenerate: () => void;
  onEditGoal: () => void;
}) {
  const btnScale = useSharedValue(1);

  return (
    <Animated.View entering={FadeInDown.duration(480).delay(180)} style={styles.emptyCard}>
      {goal ? (
        <View style={styles.goalChip}>
          <Text style={styles.goalChipLabel}>Goal</Text>
          <Text style={styles.goalChipText}>{goal}</Text>
          <Pressable onPress={onEditGoal} hitSlop={8}>
            <Text style={styles.goalChipEdit}>Edit</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.emptyHeading}>No habit yet{'\n'}for today.</Text>
      <Text style={styles.emptySub}>Let AI generate your perfect micro habit.</Text>

      <Animated.View>
        <Pressable
          onPress={onGenerate}
          onPressIn={() => {
            btnScale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
          style={styles.generateBtn}
        >
          <Text style={styles.generateBtnText}>Generate Today's Habit</Text>
          <View style={styles.generateArrow}>
            <Text style={styles.generateArrowText}>→</Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// Loading skeleton
function LoadingSkeleton() {
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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: habit, isLoading: loading, error: queryError } = useTodayHabit();
  const { data: streak = 0 } = useStreak();
  const { mutate: mark, isPending: acting } = useMarkHabit();
  const [status, setStatus] = useState<Status>('idle');
  const [savedGoal, setSavedGoal] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [contentKey, setContentKey] = useState(0);

  const firstName = user?.email?.split('@')[0] ?? 'there';
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Load goal from local storage once
  useEffect(() => {
    getGoal().then(setSavedGoal);
  }, []);

  // Trigger fade-in animation when data arrives; sync status from server state
  const wasLoading = useRef(true);
  useEffect(() => {
    if (!loading) {
      if (wasLoading.current) {
        setContentKey((k) => k + 1);
        wasLoading.current = false;
      }
      if (habit?.completed && status === 'idle') setStatus('done');
    }
  }, [loading, habit]);

  const displayError = (queryError as Error)?.message || error;

  const handleMark = (completed: boolean) => {
    if (!habit) return;
    mark(
      { id: habit.id, completed },
      {
        onSuccess: () => setStatus(completed ? 'done' : 'skipped'),
        onError: (e) => setError((e as Error).message ?? 'Something went wrong.'),
      },
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{capitalized}.</Text>
          </View>
          <StreakBadge count={streak} />
        </Animated.View>

        {/* Wordmark */}
        <Animated.View entering={FadeIn.duration(380).delay(100)} style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>atomy</Text>
        </Animated.View>

        {/* Error banner */}
        {displayError ? (
          <Animated.View entering={FadeIn.duration(280)} style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayError}</Text>
          </Animated.View>
        ) : null}

        {/* Main content */}
        <Animated.View key={contentKey} entering={FadeIn.duration(300)} style={styles.mainContent}>
          {loading ? (
            <LoadingSkeleton />
          ) : !habit ? (
            <EmptyCard
              goal={savedGoal}
              onGenerate={() => router.push('/generate')}
              onEditGoal={() => router.push('/generate')}
            />
          ) : status === 'done' ? (
            <DoneCard habit={habit} onEditGoal={() => router.push('/generate')} />
          ) : status === 'skipped' ? (
            <SkippedCard habit={habit} onEditGoal={() => router.push('/generate')} />
          ) : (
            <HabitCard
              habit={habit}
              onDone={() => handleMark(true)}
              onSkip={() => handleMark(false)}
              acting={acting}
            />
          )}
        </Animated.View>

        {/* Quick stats row */}
        {!loading && (
          <Animated.View entering={FadeInUp.duration(400).delay(420)} style={styles.statsRow}>
            <Pressable style={styles.statChip} onPress={() => router.push('/history')}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statLabel}>History</Text>
            </Pressable>
            <Pressable style={styles.statChip} onPress={() => router.push('/insights')}>
              <Text style={styles.statIcon}>✦</Text>
              <Text style={styles.statLabel}>Insights</Text>
            </Pressable>
            <Pressable style={styles.statChip} onPress={() => router.push('/generate')}>
              <Text style={styles.statIcon}>⟳</Text>
              <Text style={styles.statLabel}>New habit</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '300',
    color: MUTED,
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: INK,
    letterSpacing: -1,
    lineHeight: 38,
  },

  // Wordmark
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 36,
    marginTop: 2,
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

  // Streak badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: 4,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FB923C',
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
    lineHeight: 18,
  },

  mainContent: {
    width: '100%',
  },

  // Habit card
  habitCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: GREEN,
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
    color: GREEN,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '400',
    color: MUTED,
    letterSpacing: 0.2,
  },

  // Day arc
  arcWrap: {
    alignItems: 'center',
    gap: 3,
  },
  arcTrack: {
    width: 28,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: 'hidden',
    transform: [{ rotate: '-90deg' }],
  },
  arcFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GREEN,
    borderRadius: 2,
  },
  arcPct: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.5,
  },

  habitText: {
    fontSize: 20,
    fontWeight: '400',
    color: INK,
    lineHeight: 30,
    paddingLeft: 4,
    marginBottom: 20,
  },

  reasonBlock: {
    backgroundColor: SOFT,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  reasonEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: MUTED,
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
    flexDirection: 'row',
    gap: 10,
  },
  actionWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  doneButton: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: GREEN,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  skipButton: {
    backgroundColor: SOFT,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.2,
  },

  // State cards (done / skipped)
  stateCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: GREEN_PALE,
    borderWidth: 1.5,
    borderColor: GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateIcon: {
    fontSize: 22,
    color: GREEN,
    fontWeight: '700',
  },
  stateIconSkip: {
    backgroundColor: SOFT,
    borderColor: BORDER,
  },
  stateIconSkipText: {
    fontSize: 22,
    color: MUTED,
    fontWeight: '300',
  },
  stateHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
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
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  editGoalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: SOFT,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: BORDER,
  },
  editGoalText: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 5,
    gap: 16,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_PALE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: GREEN_LIGHT,
    gap: 10,
  },
  goalChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  goalChipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#166534',
    lineHeight: 18,
  },
  goalChipEdit: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
  },
  emptyHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  emptySub: {
    fontSize: 14,
    fontWeight: '300',
    color: MUTED,
    lineHeight: 20,
  },
  generateBtn: {
    backgroundColor: INK,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  generateArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateArrowText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Quick stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIcon: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.5,
  },

  // Skeleton
  skeleton: {
    width: '100%',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: BORDER,
    borderRadius: 7,
    width: '100%',
  },
  skeletonButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
