import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useCreateHabit } from '../hooks/useCreateHabit';
import colors from '../constants/colors';

const MAX_HABIT_CHARS = 50;
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'weekdays', 'weekends'] as const;

export default function AddHabitScreen() {
  const router = useRouter();
  const { mutate: create, isPending: saving } = useCreateHabit();
  const habitInputRef = useRef<TextInput>(null);

  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>('daily');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'habit' | 'goal' | null>(null);

  const canSubmit = habit.trim().length > 0;
  const closeSheet = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleCreate = () => {
    if (!canSubmit || saving) return;
    setError('');
    create(
      { goal: goal.trim(), habit: habit.trim(), frequency },
      {
        onSuccess: () => router.replace('/'),
        onError: (e) => setError((e as Error).message ?? 'Something went wrong.'),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.backdrop}>
        <Animated.View
          entering={SlideInDown.duration(280)}
          style={styles.sheet}
          onLayout={() => {
            requestAnimationFrame(() => habitInputRef.current?.focus());
          }}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add habit</Text>
            <Pressable onPress={closeSheet} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Habit name</Text>
              <TextInput
                ref={habitInputRef}
                style={[styles.input, focusedField === 'habit' && styles.inputFocused]}
                value={habit}
                onChangeText={(value) => {
                  setHabit(value);
                  setError('');
                }}
                placeholder="Drink water after waking up"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                maxLength={MAX_HABIT_CHARS}
                onFocus={() => setFocusedField('habit')}
                onBlur={() => setFocusedField(null)}
              />
              <Text style={styles.charCount}>
                {habit.length} / {MAX_HABIT_CHARS}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  focusedField === 'goal' && styles.inputFocused,
                ]}
                value={goal}
                onChangeText={(value) => {
                  setGoal(value);
                  setError('');
                }}
                placeholder="Good blood flow"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setFocusedField('goal')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Frequency</Text>
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

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
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
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EDE0',
  },
  closeText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.text,
    fontWeight: '300',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputMultiline: {
    minHeight: 92,
    paddingTop: 15,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.muted,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyPill: {
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frequencyPillActive: {
    backgroundColor: colors.primary,
  },
  frequencyText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: colors.surface,
  },
  createBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  createBtnDisabled: {
    opacity: 0.45,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.2,
  },
});
