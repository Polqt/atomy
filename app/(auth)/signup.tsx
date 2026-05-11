import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton, AuthError } from '../../components/AuthCard';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (done) return <SuccessState email={email} />;

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter a password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
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

  const clearErrors = () => setAuthError('');
  const canSubmit =
    isValidEmail(email) &&
    password.length >= 6 &&
    confirmPassword === password &&
    !loading;

  return (
    <AuthCardShell>
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.title}>Create account.</Text>
        <Text style={styles.subtitle}>Start building better habits today.</Text>
      </Animated.View>

      <AuthError message={authError} />

      <View style={styles.fields}>
        <AuthField
          label="Email"
          delay={180}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailError('');
            clearErrors();
          }}
          onBlur={() => {
            if (email.trim() && !isValidEmail(email)) setEmailError('Enter a valid email address.');
          }}
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
          onChangeText={(v) => {
            setPassword(v);
            setPasswordError('');
            if (confirmPassword && confirmPassword === v) setConfirmError('');
            clearErrors();
          }}
          onBlur={() => {
            if (password && password.length < 6) setPasswordError('Password must be at least 6 characters.');
          }}
          placeholder="min. 6 characters"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          error={passwordError}
          rightElement={
            <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />

        {password.length > 0 && (
          <Animated.View entering={FadeIn.duration(260)} style={styles.strengthRow}>
            <PasswordStrengthBar password={password} />
          </Animated.View>
        )}

        <AuthField
          label="Confirm password"
          delay={280}
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            setConfirmError('');
            clearErrors();
          }}
          onBlur={() => {
            if (confirmPassword && confirmPassword !== password) setConfirmError('Passwords do not match.');
          }}
          placeholder="repeat password"
          secureTextEntry={!showConfirmPassword}
          autoComplete="new-password"
          error={confirmError}
          rightElement={
            <Pressable onPress={() => setShowConfirmPassword((value) => !value)} hitSlop={8}>
              <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />
      </View>

      <View style={styles.buttonWrap}>
        <AuthButton
          label="Create account"
          onPress={handleSignup}
          loading={loading}
          disabled={!canSubmit}
          delay={320}
        />
      </View>

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
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
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
