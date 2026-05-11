import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton, AuthError } from '../../components/AuthCard';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string; success?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setAuthError(e.message ?? 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const clearErrors = () => {
    setAuthError('');
    setAuthSuccess('');
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (params.error === 'confirmation_link_invalid') {
      setAuthError('The confirmation link has expired or is invalid.');
    }
    if (params.success === 'password_updated') {
      setAuthSuccess('Your password has been updated.');
    }
  }, [params.error, params.success]);

  return (
    <AuthCardShell>
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>Sign in to continue your habit streak.</Text>
      </Animated.View>

      <AuthError message={authError} />
      {authSuccess ? (
        <Animated.View entering={FadeIn.duration(280)} style={styles.successBanner}>
          <Text style={styles.successText}>{authSuccess}</Text>
        </Animated.View>
      ) : null}

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
            clearErrors();
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="password"
          error={passwordError}
          rightElement={
            <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />
      </View>

      <Pressable style={styles.forgotWrap} onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <View style={styles.buttonWrap}>
        <AuthButton
          label="Sign in"
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
          delay={300}
        />
      </View>

      <Animated.View entering={FadeIn.duration(380).delay(460)} style={styles.switchRow}>
        <Text style={styles.switchText}>No account yet?</Text>
        <Link href="/(auth)/signup" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.switchLink}>Create one →</Text>
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
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#15803D',
    lineHeight: 19,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
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
});
