import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton } from '../../components/AuthCard';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>Sign in to continue your habit streak.</Text>
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
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          error={passwordError || authError}
        />
      </View>

      {/* CTA */}
      <View style={styles.buttonWrap}>
        <AuthButton
          label="Sign in"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          delay={300}
        />
      </View>

      {/* Switch */}
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
