import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton, AuthError } from '../../components/AuthCard';

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

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <SuccessState email={email} />;

  const handleSignup = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await signUp(email, password);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardShell>
      {/* Heading block */}
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.headingLight}>Create your</Text>
        <Text style={styles.headingBold}>account.</Text>
        <Text style={styles.subHeading}>Start building better habits today.</Text>
      </Animated.View>

      <AuthError message={error} />

      <AuthField
        label="Email"
        delay={200}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <AuthField
        label="Password"
        delay={280}
        value={password}
        onChangeText={setPassword}
        placeholder="min. 8 characters"
        secureTextEntry
        autoComplete="new-password"
      />

      {/* Password strength hint */}
      {password.length > 0 && (
        <Animated.View entering={FadeIn.duration(260)} style={styles.strengthRow}>
          <PasswordStrengthBar password={password} />
        </Animated.View>
      )}

      <View style={styles.buttonWrap}>
        <AuthButton
          label="Create account"
          onPress={handleSignup}
          loading={loading}
          disabled={!email || password.length < 6}
          delay={360}
        />
      </View>

      <Animated.View entering={FadeIn.duration(380).delay(500)} style={styles.switchRow}>
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
            style={[
              styles.strengthSegment,
              { backgroundColor: i <= strength ? color : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    marginBottom: 28,
  },
  headingLight: {
    fontSize: 34,
    fontWeight: '200',
    color: '#0A0A0A',
    letterSpacing: -1,
    lineHeight: 40,
  },
  headingBold: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    lineHeight: 19,
  },

  strengthRow: {
    marginTop: -12,
    marginBottom: 20,
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
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
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
    fontSize: 34,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -1,
    lineHeight: 40,
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
