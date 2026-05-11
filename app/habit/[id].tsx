import { View, Text, Pressable, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useHabits } from '../../hooks/useHabits';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import { useDeleteHabit } from '../../hooks/useDeleteHabit';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import { useState } from 'react';
import { formatDate, formatTime } from '@/utils/date';
import colors from '../../constants/colors';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: habits = [] } = useHabits();
  const { data: history = [] } = useHabitHistory();
  const { mutate: mark, isPending: acting } = useMarkHabit();
  const { mutate: deleteHabit, isPending: deleting } = useDeleteHabit();
  const [localStatus, setLocalStatus] = useState<'done' | 'skipped' | null>(null);
  const [error, setError] = useState('');
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  // Guard against missing or invalid ID
  if (!id) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Invalid habit ID.</Text>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Habit not found.</Text>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const effectiveStatus = localStatus ?? (habit.completed ? 'done' : null);
  const isPending = effectiveStatus === null;

  const handleMark = (completed: boolean) => {
    mark(
      { id: habit.id, completed },
      {
        onSuccess: () => setLocalStatus(completed ? 'done' : 'skipped'),
        onError: (e) => setError((e as Error).message ?? 'Something went wrong.'),
      },
    );
  };

  const recentActivity = history
    .filter((entry) => entry.habit_id === habit.id)
    .slice(0, 5);

  const confirmDelete = () => {
    Alert.alert('Delete this habit?', 'This permanently removes the habit from your list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteHabit(habit.id, {
            onSuccess: () => router.replace('/'),
            onError: (e) => setError((e as Error).message ?? 'Could not delete habit.'),
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back button + Edit */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/edit-habit?id=${id}`)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </Animated.View>

        {/* Eyebrow */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrow}>Habit Detail</Text>
        </Animated.View>

        {/* Status badge */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          {effectiveStatus === 'done' ? (
            <View style={styles.badgeDone}>
              <Text style={styles.badgeDoneText}>✓ Completed</Text>
            </View>
          ) : effectiveStatus === 'skipped' ? (
            <View style={styles.badgeSkip}>
              <Text style={styles.badgeSkipText}>– Skipped</Text>
            </View>
          ) : (
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingText}>Pending</Text>
            </View>
          )}
        </Animated.View>

        {/* Habit text */}
        <Animated.Text entering={FadeInDown.duration(440).delay(140)} style={styles.habitText}>
          {habit.habit}
        </Animated.Text>

        {/* Why this matters */}
        {habit.goal ? (
          <Animated.View entering={FadeInDown.duration(440).delay(200)} style={styles.goalBlock}>
            <View style={styles.goalEyebrowRow}>
              <View style={styles.goalEyebrowDot} />
              <Text style={styles.goalEyebrow}>Why this matters</Text>
            </View>
            <Text style={styles.goalText}>{habit.goal}</Text>
          </Animated.View>
        ) : null}

        {/* Date */}
        <Animated.Text entering={FadeInDown.duration(400).delay(240)} style={styles.dateText}>
          {formatDate(habit.created_at)}
        </Animated.Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Actions (only if pending) */}
        {isPending && (
          <Animated.View entering={FadeInDown.duration(440).delay(280)} style={styles.actions}>
            <Pressable
              onPress={acting ? undefined : () => handleMark(true)}
              style={[styles.doneBtn, acting && { opacity: 0.5 }]}
            >
              {acting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.doneBtnText}>✓ Mark as Done</Text>
              )}
            </Pressable>
            <Pressable
              onPress={acting ? undefined : () => handleMark(false)}
              style={[styles.skipLink, acting && { opacity: 0.5 }]}
            >
              <Text style={styles.skipLinkText}>Skip for today</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(440).delay(320)} style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent activity for this habit</Text>
          {recentActivity.length === 0 ? (
            <Text style={styles.noActivityText}>No activity yet</Text>
          ) : (
            recentActivity.map((entry, index) => (
              <View key={entry.id}>
                <View style={styles.activityRow}>
                  <Text style={styles.activityDate}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {formatTime(entry.created_at)}
                  </Text>
                  <View style={[styles.activityPill, entry.completed ? styles.activityPillDone : styles.activityPillSkipped]}>
                    <Text style={[styles.activityPillText, entry.completed ? styles.activityPillTextDone : styles.activityPillTextSkipped]}>
                      {entry.completed ? 'Completed' : 'Skipped'}
                    </Text>
                  </View>
                </View>
                {index !== recentActivity.length - 1 ? <View style={styles.activityDivider} /> : null}
              </View>
            ))
          )}
        </Animated.View>

        <Pressable onPress={confirmDelete} disabled={deleting} style={styles.deleteHabitButton}>
          <View style={styles.deleteSeparator} />
          <Text style={styles.deleteHabitText}>{deleting ? 'Deleting...' : 'Delete habit'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  badgeDone: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  badgeDoneText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E7A3A',
  },
  badgeSkip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,59,48,0.10)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  badgeSkipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CC2200',
  },
  badgePending: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,179,0,0.12)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  badgePendingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B37A00',
  },
  habitText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 24,
  },
  goalBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 8,
  },
  goalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalEyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  goalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
  dateText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
    marginBottom: 32,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  actions: {
    gap: 12,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  skipLink: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    height: 54,
    borderRadius: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  skipLinkText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
  },
  recentSection: {
    marginTop: 30,
    gap: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  noActivityText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.muted,
    paddingVertical: 14,
  },
  activityRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityDate: {
    fontSize: 13,
    color: colors.muted,
  },
  activityPill: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  activityPillDone: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  activityPillSkipped: {
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
  activityPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityPillTextDone: {
    color: colors.primary,
  },
  activityPillTextSkipped: {
    color: '#FF3B30',
  },
  activityDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  deleteHabitButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 24,
  },
  deleteSeparator: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  deleteHabitText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.muted,
  },
});
