import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCreateHabit } from '../hooks/useCreateHabit';
import colors from '../constants/colors';

export default function AddHabitScreen() {
  const router = useRouter();
  const { mutate: create, isPending: saving } = useCreateHabit();

  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const canSubmit = habit.trim().length > 0 && goal.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit || saving) return;
    setError('');
    create(
      { goal: goal.trim(), habit: habit.trim() },
      {
        onSuccess: () => router.replace('/'),
        onError: (e) => setError((e as Error).message ?? 'Something went wrong.'),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Habit</Text>
          <View style={styles.headerRight} />
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.form}>

          {/* Habit field */}
          <View style={styles.field}>
            <Text style={styles.label}>Habit</Text>
            <TextInput
              style={styles.input}
              value={habit}
              onChangeText={setHabit}
              placeholder="e.g. Drink water after waking up"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          {/* Why it matters */}
          <View style={styles.field}>
            <Text style={styles.label}>Why is this important?</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={goal}
              onChangeText={setGoal}
              placeholder="e.g. I want to stay hydrated and feel energized"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.duration(420).delay(160)}>
          <Pressable
            onPress={handleCreate}
            style={[styles.createBtn, (!canSubmit || saving) && styles.createBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createBtnText}>Create Habit</Text>
            )}
          </Pressable>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 70,
  },

  // Form
  form: {
    gap: 20,
    marginBottom: 28,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 14,
  },

  // Error
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },

  // CTA
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.2,
  },
});
