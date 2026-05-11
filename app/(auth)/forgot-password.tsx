import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthButton, AuthCardShell, AuthError, AuthField } from '../../components/AuthCard';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setEmailError('');
    setAuthError('');

    if (!email.trim()) {
      setEmailError('Please enter your email.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setAuthError(e.message ?? 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardShell>
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.title}>Reset password.</Text>
        <Text style={styles.subtitle}>Enter your email and we will send you a link.</Text>
      </Animated.View>

      <AuthError message={authError} />

      {sent ? (
        <Animated.View entering={FadeIn.duration(260)} style={styles.successBox}>
          <Text style={styles.successTitle}>Check your inbox.</Text>
          <Text style={styles.successText}>We sent a reset link to the email address.</Text>
        </Animated.View>
      ) : (
        <>
          <AuthField
            label="Email"
            delay={180}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailError('');
              setAuthError('');
            }}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={emailError}
          />

          <View style={styles.buttonWrap}>
            <AuthButton
              label="Send reset link"
              onPress={handleSubmit}
              loading={loading}
              disabled={!email.trim() || loading}
              delay={260}
            />
          </View>
        </>
      )}

      <Animated.View entering={FadeIn.duration(380).delay(420)} style={styles.switchRow}>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.switchLink}>← Back to sign in</Text>
          </Pressable>
        </Link>
      </Animated.View>
    </AuthCardShell>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    marginBottom: 24,
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  buttonWrap: {
    marginTop: 4,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  successText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18,
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  switchLink: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
  },
});
