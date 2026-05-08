import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton, AuthDivider, AuthOAuthButton } from '../../components/AuthCard';

function SuccessState({ email }: { email: string }) {
  return (
    <AuthCardShell>
      <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.successBlock}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successHeading}>Check your{'\n'}inbox.</Text>
        <Text style={styles.successSub}>
          A confirmation link has been sent to{'\n'}
          <Text style={styles.successEmail}>{email}</Text>
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(300)}>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to sign in</Text>
          </Pressable>
        </Link>
      </Animated.View>
    </AuthCardShell>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const colors = ['#F87171', '#FBBF24', '#22C55E'];
  const labels = ['Too short', 'Good', 'Strong'];
  const color = colors[strength - 1];
  const label = labels[strength - 1];

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthBars}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.strengthSegment, { backgroundColor: i <= strength ? color : '#E5E7EB' }]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <SuccessState email={email} />;

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    if (!email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Please enter a password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setDone(true);
    } catch (e: any) {
      setAuthError(e.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = () => {
    Alert.alert('Coming soon', 'OAuth will be available in a future update.');
  };

  return (
    <AuthCardShell>
      {/* Heading */}
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.title}>Create account.</Text>
        <Text style={styles.subtitle}>Start building better habits today.</Text>
      </Animated.View>

      {/* Fields */}
      <View style={styles.fields}>
        <AuthField
          label="Email"
          delay={180}
          value={email}
          onChangeText={(v) => { setEmail(v); setEmailError(''); }}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          error={emailError}
        />

        <AuthField
          label="Password"
          delay={240}
          value={password}
          onChangeText={(v) => { setPassword(v); setPasswordError(''); setAuthError(''); }}
          placeholder="min. 6 characters"
          secureTextEntry
          autoComplete="new-password"
          error={passwordError || authError}
        />

        {password.length > 0 && (
          <Animated.View entering={FadeIn.duration(260)} style={styles.strengthRow}>
            <PasswordStrengthBar password={password} />
          </Animated.View>
        )}
      </View>

      {/* CTA */}
      <View style={styles.buttonWrap}>
        <AuthButton
          label="Create account"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          delay={300}
        />
      </View>

      {/* OAuth */}
      <Animated.View entering={FadeIn.duration(380).delay(380)}>
        <AuthDivider />
        <AuthOAuthButton icon="G" label="Continue with Google" onPress={handleOAuth} />
        <AuthOAuthButton icon="" label="Continue with Apple" onPress={handleOAuth} />
      </Animated.View>

      {/* Switch */}
      <Animated.View entering={FadeIn.duration(380).delay(460)} style={styles.switchRow}>
        <Text style={styles.switchText}>Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.switchLink}>Sign in →</Text>
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
  fields: {
    gap: 4,
  },
  strengthRow: {
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    minWidth: 52,
    textAlign: 'right',
  },
  buttonWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  switchText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  switchLink: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
  },

  // Success state
  successBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 32,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 22,
    color: '#22C55E',
    fontWeight: '600',
  },
  successHeading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.8,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 16,
  },
  successSub: {
    fontSize: 14,
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: '#0A0A0A',
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
