import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeleteHabit } from '../../hooks/useDeleteHabit';
import { useHabitHistory } from '../../hooks/useHabitHistory';
import { useHabits } from '../../hooks/useHabits';
import { useMarkHabit } from '../../hooks/useMarkHabit';
import { queryKeys } from '../../hooks/queryKeys';
import { updateHabitWithFrequency } from '../../services/habits';
import type { HabitFrequency } from '../../types/habit';
import colors from '../../constants/colors';
import { formatTime } from '@/utils/date';

const FREQUENCIES: HabitFrequency[] = ['daily', 'weekly', 'monthly', 'weekdays', 'weekends'];

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.glass, style]}>
      <View style={styles.glassInner}>{children}</View>
    </View>
  );
}

function DropIcon() {
  return (
    <View style={styles.dropIcon}>
      <View style={styles.dropPoint} />
    </View>
  );
}

function CircleButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.circleButton}>
      {children}
    </Pressable>
  );
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: habits = [] } = useHabits();
  const { data: history = [] } = useHabitHistory();
  const { mutate: mark, isPending: marking } = useMarkHabit();
  const { mutate: deleteHabit, isPending: deleting } = useDeleteHabit();
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [error, setError] = useState('');

  const habit = habits.find((item) => item.id === id);
  const recent = useMemo(() => history.filter((entry) => entry.habit_id === id).slice(0, 5), [history, id]);

  const { mutate: saveFrequency, isPending: frequencySaving } = useMutation({
    mutationFn: (frequency: HabitFrequency) =>
      updateHabitWithFrequency(id!, habit?.habit ?? '', habit?.goal ?? '', frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      setFrequencyOpen(false);
    },
    onError: (e) => setError((e as Error).message ?? 'Could not update frequency.'),
  });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!habit) {
    return (
      <LinearGradient colors={['#A8D5A2', '#D4EDD0']} style={styles.root}>
        <Text style={styles.notFound}>Habit not found.</Text>
      </LinearGradient>
    );
  }

  const frequencyLabel = (habit.frequency ?? 'daily').charAt(0).toUpperCase() + (habit.frequency ?? 'daily').slice(1);

  const confirmDelete = () => {
    Alert.alert('Delete this habit?', 'This permanently removes the habit from your list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteHabit(habit.id, { onSuccess: () => router.replace('/') }),
      },
    ]);
  };

  return (
    <LinearGradient colors={['#A8D5A2', '#D4EDD0']} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#A8D5A2" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 22 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CircleButton onPress={goBack}><Text style={styles.headerIcon}>‹</Text></CircleButton>
          <Text style={styles.headerTitle}>Habit Detail</Text>
          <CircleButton onPress={() => {}}><Text style={styles.menuIcon}>•••</Text></CircleButton>
        </View>

        <View style={styles.hero}>
          <View style={styles.habitIconCircle}>
            <DropIcon />
          </View>
          <Text style={styles.habitTitle}>{habit.habit}</Text>
          <Pressable style={styles.frequencyPill} onPress={() => setFrequencyOpen(true)}>
            <Text style={styles.frequencyText}>{frequencyLabel}</Text>
            <Text style={styles.frequencyChevron}>⌄</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <GlassCard>
          <View style={styles.glassLabelRow}>
            <Text style={styles.glassIcon}>💚</Text>
            <Text style={styles.glassLabel}>Why this matters</Text>
          </View>
          <Text style={styles.glassBody}>{habit.goal}</Text>
        </GlassCard>

        <GlassCard>
          <View style={styles.glassLabelRow}>
            <Text style={styles.glassIcon}>🔥</Text>
            <Text style={styles.glassLabel}>This streak</Text>
          </View>
          <Text style={styles.streakCount}>2 days</Text>
          <Text style={styles.streakSub}>Keep it going!</Text>
        </GlassCard>

        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          <View style={styles.activityList}>
            {recent.map((entry, index) => (
              <View key={entry.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, entry.completed ? styles.activityIconDone : styles.activityIconSkipped]}>
                    <Text style={[styles.activityIconText, !entry.completed && styles.activityIconTextSkipped]}>
                      {entry.completed ? '✓' : '−'}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {formatTime(entry.created_at)}
                  </Text>
                  <View style={[styles.statusPill, entry.completed ? styles.statusPillDone : styles.statusPillSkipped]}>
                    <Text style={[styles.statusText, entry.completed ? styles.statusTextDone : styles.statusTextSkipped]}>
                      {entry.completed ? 'Completed' : 'Skipped'}
                    </Text>
                  </View>
                </View>
                {index !== recent.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.doneButton, marking && styles.disabled]}
            disabled={marking}
            onPress={() => mark({ id: habit.id, completed: true })}
          >
            {marking ? <ActivityIndicator color="#fff" /> : <Text style={styles.doneText}>✓ Mark as Done</Text>}
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => mark({ id: habit.id, completed: false })}>
            <Text style={styles.skipText}>Skip for today</Text>
          </Pressable>
          <Pressable disabled={deleting} onPress={confirmDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>{deleting ? 'Deleting...' : 'Delete habit'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={frequencyOpen} animationType="fade" onRequestClose={() => setFrequencyOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFrequencyOpen(false)}>
          <View style={styles.frequencyMenu}>
            {FREQUENCIES.map((item) => (
              <Pressable
                key={item}
                disabled={frequencySaving}
                onPress={() => saveFrequency(item)}
                style={styles.frequencyOption}
              >
                <Text style={[styles.frequencyOptionText, habit.frequency === item && styles.frequencyOptionActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.text,
  },
  menuIcon: {
    fontSize: 16,
    letterSpacing: -1,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 10,
  },
  habitIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  dropIcon: {
    width: 28,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  dropPoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    right: 7,
    bottom: 7,
  },
  habitTitle: {
    marginTop: 18,
    maxWidth: 260,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  frequencyPill: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  frequencyText: {
    fontSize: 13,
    color: colors.text,
  },
  frequencyChevron: {
    fontSize: 13,
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  glass: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.54)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  glassInner: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    padding: 16,
  },
  glassLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  glassIcon: {
    fontSize: 16,
  },
  glassLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  glassBody: {
    fontSize: 15,
    color: colors.text,
  },
  streakCount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  streakSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#2F8F4E',
  },
  activitySection: {
    marginTop: 8,
    gap: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  activityList: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  activityRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconDone: {
    backgroundColor: colors.primary,
  },
  activityIconSkipped: {
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
  activityIconText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  activityIconTextSkipped: {
    color: '#CC2200',
  },
  activityDate: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },
  statusPill: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillDone: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  statusPillSkipped: {
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextDone: {
    color: '#1E7A3A',
  },
  statusTextSkipped: {
    color: '#CC2200',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 40,
  },
  actions: {
    marginTop: 16,
    gap: 20,
  },
  doneButton: {
    height: 54,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    height: 54,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  skipText: {
    fontSize: 15,
    color: colors.muted,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  disabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  frequencyMenu: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  frequencyOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  frequencyOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  frequencyOptionActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  notFound: {
    marginTop: 120,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
  },
});
