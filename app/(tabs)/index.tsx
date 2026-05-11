import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import TabScreen from '@/components/TabScreen';
import { LoadingSkeleton } from '@/components/HomeCards';
import { useAuth } from '../../context/AuthContext';
import { useTodayHabits } from '../../hooks/useTodayHabit';
import { useStreak } from '../../hooks/useStreak';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import { useDeleteHabit } from '../../hooks/useDeleteHabit';
import { type TodayHabit } from '../../services/habits';
import colors from '../../constants/colors';
import { getDisplayNameFromEmail, getInitial } from '@/utils/user';

function SeedlingIllustration() {
  return (
    <View style={styles.seedling}>
      <View style={styles.seedStem} />
      <View style={[styles.seedLeaf, styles.seedLeafLeft]} />
      <View style={[styles.seedLeaf, styles.seedLeafRight]} />
    </View>
  );
}

function FireIllustration() {
  return (
    <View style={styles.fire}>
      <View style={styles.fireOuter} />
      <View style={styles.fireInner} />
      <View style={styles.fireCore} />
    </View>
  );
}

function TodayDots({ habits }: { habits: TodayHabit[] }) {
  return (
    <View style={styles.dotsBlock}>
      <Text style={styles.dotsLabel}>TODAY</Text>
      <View style={styles.dotsRow}>
        {habits.length === 0 ? (
          <View style={styles.dotEmpty} />
        ) : (
          habits.map((habit) => (
            <View key={habit.id} style={[styles.dot, habit.completed ? styles.dotDone : styles.dotPending]} />
          ))
        )}
      </View>
    </View>
  );
}

function HabitRow({
  habit,
  onDone,
  onDelete,
  acting,
  isLast,
}: {
  habit: TodayHabit;
  onDone: () => void;
  onDelete: () => void;
  acting: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12 && Math.abs(gesture.dy) < 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) translateX.setValue(Math.max(gesture.dx, -80));
      },
      onPanResponderRelease: (_, gesture) => {
        RNAnimated.spring(translateX, {
          toValue: gesture.dx < -44 ? -80 : 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const confirmDelete = () => {
    Alert.alert('Delete this habit?', 'This permanently removes the habit from your list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          RNAnimated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(onDelete);
        },
      },
    ]);
  };

  return (
    <RNAnimated.View style={{ opacity }}>
      <Pressable style={styles.deleteAction} onPress={confirmDelete}>
        <Text style={styles.deleteIcon}>⌫</Text>
      </Pressable>
      <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <Pressable style={styles.habitRow} onPress={() => router.push(`/habit/${habit.id}`)}>
          <View style={styles.statusCircle}>
            <View style={[styles.statusDot, habit.completed && styles.statusDotDone]} />
          </View>

          <View style={styles.habitTextBlock}>
            <Text style={styles.habitName} numberOfLines={2} ellipsizeMode="tail">
              {habit.habit}
            </Text>
            {habit.goal ? (
              <Text style={styles.habitGoal} numberOfLines={1}>
                {habit.goal}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={onDone}
            disabled={acting}
            style={[styles.checkCircle, habit.completed && styles.checkCircleDone, acting && styles.dimmed]}
          >
            {acting ? (
              <ActivityIndicator color={habit.completed ? '#fff' : colors.muted} size="small" />
            ) : (
              <Text style={[styles.checkText, habit.completed && styles.checkTextDone]}>✓</Text>
            )}
          </Pressable>

          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </RNAnimated.View>
      {!isLast ? <View style={styles.rowDivider} /> : null}
    </RNAnimated.View>
  );
}

function HabitListCard({
  habits,
  actingId,
  onMark,
  onDelete,
  onCreate,
}: {
  habits: TodayHabit[];
  actingId: string | null;
  onMark: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  if (habits.length === 0) {
    return (
      <View style={styles.listCard}>
        <View style={styles.emptyState}>
          <View style={styles.emptyPlusCircle}>
            <Text style={styles.emptyPlus}>+</Text>
          </View>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Pressable onPress={onCreate} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Create your first habit</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listCard}>
      {habits.map((habit, index) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          onDone={() => onMark(habit.id, !habit.completed)}
          onDelete={() => onDelete(habit.id)}
          acting={actingId === habit.id}
          isLast={index === habits.length - 1}
        />
      ))}
      {habits.length <= 3 ? (
        <Text style={styles.listFooter}>Tap a habit to view details or swipe to delete.</Text>
      ) : null}
    </View>
  );
}

function ConfettiPiece({ index, active }: { index: number; active: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / 16) * Math.PI * 2;
  const distance = 90 + (index % 4) * 18;
  const colorSet = ['#34C759', '#FFD166', '#FF6B6B', '#5AC8FA'];

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(index * 18, withTiming(1, { duration: 900 }));
  }, [active, index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { rotate: `${progress.value * 220}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.confettiPiece, { backgroundColor: colorSet[index % colorSet.length] }, animatedStyle]}
    />
  );
}

function CompletionOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(200)} style={styles.overlay}>
      <View style={styles.confettiOrigin}>
        {Array.from({ length: 16 }).map((_, index) => (
          <ConfettiPiece key={index} index={index} active={visible} />
        ))}
      </View>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayCheck}>✅</Text>
        <Text style={styles.overlayText}>All done for today</Text>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: habits = [], isLoading: loading, error: queryError } = useTodayHabits();
  const { data: streak = 0 } = useStreak();
  const { mutate: mark } = useMarkHabit();
  const { mutate: deleteHabit } = useDeleteHabit();
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const previousDoneCount = useRef<number | null>(null);

  const displayName = (user?.user_metadata?.name as string | undefined) || getDisplayNameFromEmail(user?.email, 'there');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = getInitial(displayName);
  const displayError = (queryError as Error)?.message || error;
  const doneCount = habits.filter((h) => h.completed).length;
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleMark = (id: string, completed: boolean) => {
    setActingId(id);
    mark(
      { id, completed },
      {
        onSettled: () => setActingId(null),
        onError: (e) => setError((e as Error).message ?? 'Something went wrong.'),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteHabit(id, {
      onError: (e) => setError((e as Error).message ?? 'Could not delete habit.'),
    });
  };

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (loading) return;
    const previous = previousDoneCount.current;
    if (previous !== null && habits.length > 0 && previous < habits.length && doneCount === habits.length) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      previousDoneCount.current = doneCount;
      return () => clearTimeout(timer);
    }
    previousDoneCount.current = doneCount;
  }, [doneCount, habits.length, loading]);

  return (
    <TabScreen>
      <View style={styles.root}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.profileBlock}>
            <Pressable style={styles.avatarWrap} onPress={() => router.push('/profile')}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}
            </Pressable>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.dateSubtitle}>{todayLabel}</Text>
          </Animated.View>

          {displayError ? (
            <Animated.View entering={FadeInDown.duration(280)} style={styles.errorBanner}>
              <Text style={styles.errorText}>{displayError}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.duration(360).delay(120)} style={styles.hero}>
            {streak > 0 ? <FireIllustration /> : <SeedlingIllustration />}
            {streak > 0 ? <Text style={styles.heroNumber}>{streak}</Text> : <Text style={styles.heroZeroLabel}>Start your streak today</Text>}
            {streak > 0 ? <Text style={styles.heroLabel}>day streak</Text> : null}
            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statChipValue}>{habits.length}</Text>
                <Text style={styles.statChipLabel}>Habits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statChipValue}>{doneCount} of {habits.length}</Text>
                <Text style={styles.statChipLabel}>Today</Text>
              </View>
            </View>
          </Animated.View>

          {!loading ? <TodayDots habits={habits} /> : null}

          <Animated.View entering={FadeInDown.duration(300)} style={styles.mainContent}>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <HabitListCard
                habits={habits}
                actingId={actingId}
                onMark={handleMark}
                onDelete={handleDelete}
                onCreate={() => router.push('/add-habit')}
              />
            )}
          </Animated.View>
        </ScrollView>
        <CompletionOverlay visible={showCelebration} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileBlock: {
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  name: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 25,
    textAlign: 'center',
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
    textAlign: 'center',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  errorText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  hero: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedling: {
    width: 96,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  seedStem: {
    width: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    transform: [{ rotate: '6deg' }],
  },
  seedLeaf: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderTopLeftRadius: 34,
    borderBottomRightRadius: 34,
    backgroundColor: '#8FD14F',
  },
  seedLeafLeft: { left: 18, top: 14, transform: [{ rotate: '24deg' }] },
  seedLeafRight: { right: 18, top: 8, transform: [{ rotate: '-34deg' }] },
  fire: {
    width: 110,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fireOuter: {
    position: 'absolute',
    width: 82,
    height: 100,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 70,
    backgroundColor: '#FF7A1A',
    transform: [{ rotate: '38deg' }],
  },
  fireInner: {
    position: 'absolute',
    bottom: 9,
    width: 54,
    height: 68,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 46,
    backgroundColor: '#FFD166',
    transform: [{ rotate: '28deg' }],
  },
  fireCore: {
    position: 'absolute',
    bottom: 13,
    width: 28,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#FFF4C2',
  },
  heroNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 58,
    fontVariant: ['tabular-nums'],
  },
  heroZeroLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 24,
    marginTop: 2,
  },
  heroLabel: { fontSize: 13, fontWeight: '400', color: colors.muted },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
  },
  statItem: {
    minWidth: 72,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statChipLabel: { fontSize: 10, color: colors.muted },
  dotsBlock: { height: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dotsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 1.4,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotDone: { backgroundColor: colors.primary },
  dotPending: { backgroundColor: colors.border },
  dotEmpty: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  mainContent: { width: '100%', marginTop: 10 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  deleteIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  habitRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },
  statusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52,199,89,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.border,
  },
  statusDotDone: { backgroundColor: colors.primary },
  habitTextBlock: { flex: 1.35, minWidth: 0, paddingHorizontal: 10, gap: 2 },
  habitName: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 20 },
  habitGoal: { fontSize: 12, fontWeight: '400', color: colors.muted, lineHeight: 17 },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: '#C7C7CC', fontWeight: '700' },
  checkTextDone: { color: '#fff' },
  dimmed: { opacity: 0.45 },
  chevron: { fontSize: 24, color: colors.muted, marginLeft: -4 },
  rowDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginLeft: 56 },
  listFooter: {
    paddingTop: 12,
    textAlign: 'center',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    color: colors.muted,
  },
  emptyState: { alignItems: 'center', paddingVertical: 26 },
  emptyPlusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyPlus: { fontSize: 34, lineHeight: 38, color: colors.primary, fontWeight: '300' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20 },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,237,224,0.45)',
    zIndex: 10,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  overlayCheck: { fontSize: 42, marginBottom: 10 },
  overlayText: { fontSize: 18, fontWeight: '700', color: colors.text },
  confettiOrigin: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: { position: 'absolute', width: 9, height: 16, borderRadius: 3 },
});
