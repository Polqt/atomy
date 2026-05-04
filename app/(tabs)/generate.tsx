import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { type HabitEntry } from '../../services/ai';
import { getGoal, saveGoal } from '../../services/goal';
import colors from '../../constants/colors';
import { useTodayHabit } from '../../hooks/useTodayHabit';
import { useGenerateHabit } from '../../hooks/useGenerateHabit';
import { useCreateHabit } from '../../hooks/useCreateHabit';

export default function GenerateScreen() {
  const [goalInput, setGoalInput] = useState('');
  const [savedGoal, setSavedGoal] = useState<string | null>(null);
  const [result, setResult] = useState<{ habit: string; reason: string } | null>(null);
  const [error, setError] = useState('');

  const { data: todayHabit, isLoading: habitLoading } = useTodayHabit();
  const { mutateAsync: generate, isPending: isGenerating } = useGenerateHabit();
  const { mutateAsync: create } = useCreateHabit();

  const history: HabitEntry[] = [];
  const loading = habitLoading || isGenerating;

  // Populate state from cached query on first load
  const initialised = useRef(false);
  useEffect(() => {
    if (habitLoading || initialised.current) return;
    initialised.current = true;

    getGoal().then((stored) => {
      if (todayHabit) {
        setSavedGoal(todayHabit.goal);
        setResult({ habit: todayHabit.habit, reason: "You've already generated today's habit." });
        return;
      }
      if (stored) setSavedGoal(stored);
    });
  }, [habitLoading, todayHabit]);

  const handleGenerate = async (goal: string) => {
    setError('');
    setResult(null);
    try {
      await saveGoal(goal);
      setSavedGoal(goal);

      if (todayHabit) {
        setResult({ habit: todayHabit.habit, reason: "You've already generated today's habit." });
        return;
      }

      const data = await generate({ goal, history });
      await create({ goal, habit: data.habit });
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    }
  };

  const handleEditGoal = () => {
    setGoalInput(savedGoal ?? '');
    setSavedGoal(null);
    setResult(null);
    setError('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8A96E" size="small" />
      </View>
    );
  }

  // Goal not set yet — first-use input
  if (!savedGoal) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <Text style={styles.wordmark}>atomy</Text>
          <Text style={styles.heading}>What's your goal?</Text>
          <Text style={styles.sub}>You'll only need to set this once.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>YOUR GOAL</Text>
            <TextInput
              style={styles.input}
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="e.g. Run a 5K"
              placeholderTextColor={colors.secondary}
              autoCapitalize="sentences"
              returnKeyType="done"
              autoFocus
              onSubmitEditing={() => goalInput.trim() && handleGenerate(goalInput.trim())}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!goalInput.trim() || loading) && styles.buttonDisabled]}
            onPress={() => handleGenerate(goalInput.trim())}
            disabled={!goalInput.trim() || loading}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Set Goal & Generate'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Goal set — show result or generating state
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.wordmark}>atomy</Text>
        <Text style={styles.heading}>Today's habit</Text>

        <View style={styles.goalRow}>
          <View style={styles.goalMeta}>
            <Text style={styles.label}>YOUR GOAL</Text>
            <Text style={styles.goalText}>{savedGoal}</Text>
          </View>
          <TouchableOpacity onPress={handleEditGoal} activeOpacity={0.7}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color="#C8A96E" size="small" style={{ marginTop: 32 }} />
        ) : !result ? (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleGenerate(savedGoal)}
            disabled={loading}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Generate habit'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.habitText}>{result.habit}</Text>
            <View style={styles.divider} />
            <Text style={styles.reasonText}>{result.reason}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 32,
  },
  wordmark: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 32,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1C0E0E',
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  goalMeta: {
    flex: 1,
  },
  goalText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '300',
  },
  editLink: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingTop: 18,
    paddingLeft: 16,
  },
  card: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  habitText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  reasonText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});
