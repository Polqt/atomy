import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabScreen from '@/components/TabScreen';
import { useAuth } from '../../context/AuthContext';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import { useStreak } from '../../hooks/useStreak';
import { useTodayHabits } from '../../hooks/useTodayHabit';
import colors from '../../constants/colors';
import { getProgressMessage } from '../../constants/progress';
import { getDisplayNameFromEmail, getInitial } from '@/utils/user';
import { formatTime } from '@/utils/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function WeekChips({ completedIndexes }: { completedIndexes: Set<number> }) {
  const todayIndex = new Date().getDay();
  return (
    <View style={styles.weekRow}>
      {WEEKDAYS.map((day, index) => {
        const active = completedIndexes.has(index);
        const isToday = index === todayIndex;
        return (
          <View key={`${day}-${index}`} style={styles.weekChip}>
            <Text style={styles.weekInitial}>{day}</Text>
            <View style={[styles.weekDot, active && styles.weekDotDone, isToday && styles.weekDotToday]} />
          </View>
        );
      })}
    </View>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(percent, 100));
  const isComplete = safePercent >= 100;
  const isEmpty = safePercent <= 0;

  return (
    <View style={styles.progressRingWrap}>
      <View style={[styles.progressRingOuter, isComplete && styles.progressRingComplete]}>
        {!isEmpty && !isComplete ? (
          <View style={[styles.progressArc, { transform: [{ rotate: `${safePercent * 1.8 - 90}deg` }] }]} />
        ) : null}
        <View style={styles.progressRingInner}>
          <Text style={styles.progressPercent}>{safePercent}%</Text>
        </View>
      </View>
      <Text style={styles.progressLabel}>14-day progress</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: todayHabits = [] } = useTodayHabits();
  const { data: history = [] } = useHabitHistory();
  const { data: streak = 0 } = useStreak();
  const { mutate: mark } = useMarkHabit();

  const displayName = (user?.user_metadata?.name as string | undefined) || getDisplayNameFromEmail(user?.email, 'there');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const primaryHabit = todayHabits[0];
  const completedToday = todayHabits.filter((habit) => habit.completed).length;
  const completedIndexes = new Set(
    history
      .filter((entry) => entry.completed)
      .map((entry) => new Date(`${entry.checkin_date || entry.created_at.slice(0, 10)}T00:00:00`).getDay()),
  );
  const recent14 = history.slice(0, 14);
  const progress = recent14.length > 0 ? Math.round((recent14.filter((entry) => entry.completed).length / recent14.length) * 100) : 0;
  const progressMessage = getProgressMessage(progress);

  const handleToggle = () => {
    if (!primaryHabit) return;
    mark({ id: primaryHabit.id, completed: !primaryHabit.completed });
  };

  return (
    <TabScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitial(displayName)}</Text>
            )}
          </Pressable>
        </View>

        <Card>
          <View style={styles.streakTop}>
            <Text style={styles.fire}>🔥</Text>
            <View>
              <Text style={styles.streakText}>{streak} day streak</Text>
              <Text style={styles.streakSub}>Keep building</Text>
            </View>
          </View>
          <WeekChips completedIndexes={completedIndexes} />
        </Card>

        <Pressable disabled={!primaryHabit} onPress={() => primaryHabit && router.push(`/habit/${primaryHabit.id}`)}>
          <Card style={styles.todayCard}>
          <View style={styles.todayCopy}>
            <Text style={styles.cardLabel}>Today's Habit</Text>
            <Text style={styles.todayHabitName} numberOfLines={2}>
              {primaryHabit?.habit ?? 'No habit yet'}
            </Text>
            <Text style={styles.todayHabitGoal} numberOfLines={1}>
              {primaryHabit?.goal ?? 'Create a habit to begin'}
            </Text>
            <Text style={styles.todayTime}>{primaryHabit ? formatTime(primaryHabit.created_at) : '--:--'}</Text>
          </View>
          <Pressable
            onPress={handleToggle}
            disabled={!primaryHabit}
            style={[styles.todayCheck, !primaryHabit?.completed && styles.todayCheckPending]}
          >
            <Text style={[styles.todayCheckText, !primaryHabit?.completed && styles.todayCheckTextPending]}>✓</Text>
          </Pressable>
          </Card>
        </Pressable>

        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressContent}>
            <ProgressRing percent={progress} />
            <View style={styles.progressCopy}>
              <Text style={styles.progressHeadline}>{progressMessage.headline}</Text>
              <Text style={styles.progressSub}>{progressMessage.subtitle}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightRow}>
            <View style={styles.insightColumn}>
              <Text style={styles.insightLabel}>Most consistent</Text>
              <Text style={styles.insightGreen}>Tuesday</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.insightColumn}>
              <Text style={styles.insightLabel}>Current streak</Text>
              <Text style={styles.insightValue}>{streak} days</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  fire: {
    fontSize: 24,
  },
  streakText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.fire,
  },
  streakSub: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekChip: {
    alignItems: 'center',
    gap: 12,
  },
  weekInitial: {
    fontSize: 11,
    color: colors.muted,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E5EA',
  },
  weekDotDone: {
    backgroundColor: colors.primary,
  },
  weekDotToday: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  todayCard: {
    minHeight: 154,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayCopy: {
    flex: 1,
    paddingRight: 14,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 14,
  },
  todayHabitName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.text,
  },
  todayHabitGoal: {
    marginTop: 7,
    fontSize: 13,
    color: colors.muted,
  },
  todayTime: {
    marginTop: 15,
    fontSize: 13,
    color: colors.muted,
  },
  todayCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCheckPending: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  todayCheckText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  todayCheckTextPending: {
    color: '#C7C7CC',
  },
  progressCard: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressRingWrap: {
    width: 92,
    alignItems: 'center',
    gap: 7,
  },
  progressRingOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 10,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressRingComplete: {
    borderColor: colors.primary,
  },
  progressArc: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 10,
    borderLeftColor: colors.primary,
    borderTopColor: colors.primary,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  progressCopy: {
    flex: 1,
  },
  progressHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressSub: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  insightColumn: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 42,
    backgroundColor: colors.divider,
    marginHorizontal: 16,
  },
  insightLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
  },
  insightGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
