import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { AuthCardShell, AuthField, AuthButton, AuthError } from '../../components/AuthCard';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCardShell>
      {/* Heading block */}
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.headingLight}>Welcome</Text>
        <Text style={styles.headingBold}>back.</Text>
        <Text style={styles.subHeading}>Sign in to continue your habit streak.</Text>
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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
      />

      <View style={styles.buttonWrap}>
        <AuthButton
          label="Sign in"
          onPress={handleLogin}
          loading={loading}
          disabled={!email || !password}
          delay={360}
        />
      </View>

      <Animated.View entering={FadeIn.duration(380).delay(500)} style={styles.switchRow}>
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
});
