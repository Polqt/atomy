import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';

export default function SetupNameScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && !loading;

  const handleContinue = async () => {
    if (!canContinue) return;
    setError('');
    setLoading(true);
    try {
      await updateProfile(trimmed);
      router.push('/setup/photo');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={styles.inner}>
        <Animated.Text entering={FadeInDown.duration(400).delay(0)} style={styles.wordmark}>
          atomy
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(440).delay(80)} style={styles.headingBlock}>
          <Text style={styles.heading}>What should{'\n'}we call you?</Text>
          <Text style={styles.sub}>You can always change this later.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(440).delay(160)} style={styles.inputBlock}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => { setName(v); setError(''); }}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(440).delay(220)} style={styles.footer}>
          <Pressable
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Continue →</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 48,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 5,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  headingBlock: {
    marginBottom: 40,
    gap: 10,
  },
  heading: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 20,
  },
  inputBlock: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    paddingHorizontal: 4,
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
