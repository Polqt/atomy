import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { AuthButton, AuthCardShell, AuthError, AuthField } from '../../components/AuthCard';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');
    setAuthError('');

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }

    if (confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await signOut();
      router.replace({
        pathname: '/(auth)/login',
        params: { success: 'password_updated' },
      });
    } catch (error: any) {
      setAuthError(error?.message ?? 'Could not update your password.');
      setLoading(false);
    }
  };

  const clearErrors = () => {
    setPasswordError('');
    setConfirmError('');
    setAuthError('');
  };

  const canSubmit = password.length >= 6 && confirmPassword === password && !loading;

  return (
    <AuthCardShell>
      <Animated.View entering={FadeInDown.duration(420).delay(100)} style={styles.headingBlock}>
        <Text style={styles.title}>New password.</Text>
        <Text style={styles.subtitle}>Enter and confirm your new password.</Text>
      </Animated.View>

      <AuthError message={authError} />

      <View style={styles.fields}>
        <AuthField
          label="New password"
          delay={180}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearErrors();
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          error={passwordError}
          rightElement={
            <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />

        <AuthField
          label="Confirm new password"
          delay={240}
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearErrors();
          }}
          placeholder="••••••••"
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
          label="Save new password"
          onPress={handleSave}
          loading={loading}
          disabled={!canSubmit}
          delay={300}
        />
      </View>
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
  buttonWrap: {
    marginTop: 4,
  },
});
