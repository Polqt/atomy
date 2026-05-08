import { View, Text, Pressable, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useHabits } from '../../hooks/useHabits';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import { useState } from 'react';
import { formatDate } from '@/utils/date';
import colors from '../../constants/colors';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: habits = [] } = useHabits();
  const { mutate: mark, isPending: acting } = useMarkHabit();
  const [localStatus, setLocalStatus] = useState<'done' | 'skipped' | null>(null);
  const [error, setError] = useState('');

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Habit not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back button + Edit */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
            <Text style={styles.goalEyebrow}>Why this matters</Text>
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
    backgroundColor: colors.primaryPale,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginBottom: 20,
  },
  badgeDoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  badgeSkip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.skipBg,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.skipBorder,
    marginBottom: 20,
  },
  badgeSkipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.skipText,
  },
  badgePending: {
    alignSelf: 'flex-start',
    backgroundColor: colors.soft,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  badgePendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  habitText: {
    fontSize: 26,
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
    borderRadius: 50,
    paddingVertical: 16,
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.muted,
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
