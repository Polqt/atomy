import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TabScreen from '@/components/TabScreen';
import { useGenerateHabit } from '../../hooks/useGenerateHabit';
import { useCreateHabit } from '../../hooks/useCreateHabit';
import { useHabits } from '../../hooks/useHabits';
import colors from '../../constants/colors';
import type { HabitEntry } from '../../services/ai';

export default function GenerateScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ habit: string; reason: string } | null>(null);

  const { mutateAsync: generate, isPending: isGenerating } = useGenerateHabit();
  const { mutateAsync: create, isPending: isCreating } = useCreateHabit();
  const { data: habits = [] } = useHabits();

  const history = useMemo<HabitEntry[]>(
    () =>
      habits
        .slice(0, 20)
        .reverse()
        .map((h) => ({ habit: h.habit, completed: h.completed })),
    [habits],
  );

  const canGenerate = goal.trim().length > 0 && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError('');
    setResult(null);
    try {
      const data = await generate({ goal: goal.trim(), history });
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    }
  };

  const handleAdd = async () => {
    if (!result || isCreating) return;
    try {
      await create({ goal: goal.trim(), habit: result.habit });
      router.replace('/');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>AI Habit</Text>
        <Text style={styles.sub}>Describe a goal and get a habit suggestion.</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>YOUR GOAL</Text>
          <TextInput
            style={styles.input}
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g. Run a 5K"
            placeholderTextColor={colors.muted}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={handleGenerate}
          />
        </View>

        <Pressable
          style={[styles.button, !canGenerate && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>Generate Habit</Text>
          )}
        </Pressable>

        {result && (
          <Animated.View entering={FadeInDown.duration(360)} style={styles.card}>
            <Text style={styles.habitText}>{result.habit}</Text>
            <View style={styles.divider} />
            <Text style={styles.reasonText}>{result.reason}</Text>

            <Pressable
              style={[styles.addButton, isCreating && styles.buttonDisabled]}
              onPress={handleAdd}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.buttonText}>Add This Habit</Text>
              )}
            </Pressable>

            <Pressable style={styles.retryLink} onPress={handleGenerate} disabled={isGenerating}>
              <Text style={styles.retryText}>Try a different suggestion</Text>
            </Pressable>
          </Animated.View>
        )}
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
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 32,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  field: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
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
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  card: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  habitText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  reasonText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  addButton: {
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
    marginBottom: 12,
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 13,
    color: colors.muted,
  },
});
