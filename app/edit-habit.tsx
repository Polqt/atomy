import { View, Text, Pressable, StyleSheet, ScrollView, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHabitWithFrequency, deleteHabit } from '../services/habits';
import type { HabitFrequency } from '../types/habit';
import { useHabits } from '../hooks/useHabits';
import { queryKeys } from '../hooks/queryKeys';
import colors from '../constants/colors';

const FREQUENCIES: HabitFrequency[] = ['daily', 'weekly', 'monthly', 'weekdays', 'weekends'];

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: habits = [] } = useHabits();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  if (!id) {
    return (
      <View style={styles.root}>
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

  const [habitText, setHabitText] = useState(habit?.habit ?? '');
  const [goalText, setGoalText] = useState(habit?.goal ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily');

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => updateHabitWithFrequency(id!, habitText.trim(), goalText.trim(), frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      goBack();
    },
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => deleteHabit(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayHabits });
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      router.replace('/');
    },
  });

  const confirmDelete = () => {
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove() },
    ]);
  };

  if (!habit) {
    return (
      <View style={styles.root}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Habit not found.</Text>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const canSave = habitText.trim().length > 0 && goalText.trim().length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>Edit Habit</Text>
          </View>
          <Text style={styles.pageTitle}>Update your habit</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(440).delay(120)} style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Habit description</Text>
            <TextInput
              style={styles.input}
              value={habitText}
              onChangeText={setHabitText}
              placeholder="e.g. Drink one glass of water after waking up"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Your goal</Text>
            <TextInput
              style={styles.input}
              value={goalText}
              onChangeText={setGoalText}
              placeholder="e.g. Drink more water daily"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFrequency(item)}
                  style={[styles.frequencyPill, frequency === item && styles.frequencyPillActive]}
                >
                  <Text style={[styles.frequencyText, frequency === item && styles.frequencyTextActive]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(440).delay(180)}>
          <Pressable
            onPress={canSave && !saving ? () => save() : undefined}
            style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.deleteSection}>
          <Pressable onPress={deleting ? undefined : confirmDelete} style={[deleting && { opacity: 0.5 }]}>
            <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete Habit'}</Text>
          </Pressable>
        </Animated.View>

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
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  topBar: {
    marginBottom: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 32,
  },
  form: {
    gap: 20,
    marginBottom: 28,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  saveBtn: {
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
    marginBottom: 24,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  deleteSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.danger,
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyPill: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frequencyPillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  frequencyText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  frequencyTextActive: {
    color: colors.primary,
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
