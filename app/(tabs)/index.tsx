import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import TabScreen from '@/components/TabScreen';
import { EmptyCard, HabitListItem, LoadingSkeleton } from '@/components/HomeCards';
import { useAuth } from '../../context/AuthContext';
import { useTodayHabits } from '../../hooks/useTodayHabit';
import { useStreak } from '../../hooks/useStreak';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import colors from '../../constants/colors';
import { getDisplayNameFromEmail, getGreeting, getInitial } from '@/utils/user';

function StreakBadge({ count }: { count: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (count === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.streakBadge}>
      <Animated.Text style={[styles.streakFlame, animStyle]}>🔥</Animated.Text>
      <Text style={styles.streakCount}>{count}</Text>
      <Text style={styles.streakLabel}>{count === 1 ? 'day' : 'days'}</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: habits = [], isLoading: loading, error: queryError } = useTodayHabits();
  const { data: streak = 0 } = useStreak();
  const { mutate: mark } = useMarkHabit();
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [contentKey, setContentKey] = useState(0);

  const displayName = (user?.user_metadata?.name as string | undefined) || getDisplayNameFromEmail(user?.email, 'there');
  
  const wasLoading = useRef(true);
  useEffect(() => {
    if (!loading && wasLoading.current) {
      setContentKey((k) => k + 1);
      wasLoading.current = false;
    }
  }, [loading]);

  const displayError = (queryError as Error)?.message || error;

  const doneCount = habits.filter((h) => h.completed).length;

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

  return (
    <TabScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View style={styles.headerRight}>
            <StreakBadge count={streak} />
          </View>
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
          ) : habits.length === 0 ? (
            <EmptyCard onGenerate={() => router.push('/add-habit')} />
          ) : (
            <View>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Today</Text>
                <Text style={styles.listProgress}>{doneCount}/{habits.length} done</Text>
              </View>
              {habits.map((habit) => (
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onDone={() => handleMark(habit.id, true)}
                  acting={actingId === habit.id}
                />
              ))}
            </View>
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
            <Pressable style={styles.statChip} onPress={() => router.push('/add-habit')}>
              <Text style={styles.statIcon}>＋</Text>
              <Text style={styles.statLabel}>Add habit</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.muted,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
  streakFlame: { fontSize: 14 },
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
    lineHeight: 18,
  },

  mainContent: { width: '100%' },

  // Habit list
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  listProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Quick stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
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
    borderColor: colors.border,
  },
  statIcon: { fontSize: 16 },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.5,
  },
});
